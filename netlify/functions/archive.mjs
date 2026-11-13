import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  // Une archive = un fichier séparé : deux personnes peuvent sauvegarder en même temps sans rien écraser
  const store = getStore({ name: "archive", consistency: "strong" });
  const imgStore = getStore({ name: "images", consistency: "strong" });

  const list = async () => {
    // Migration de l'ancien format (tout dans une seule clé)
    const legacy = await store.get("items", { type: "json" });
    if (Array.isArray(legacy) && legacy.length) {
      for (const it of legacy) await store.setJSON("item:" + it.id, it);
      await store.delete("items");
    }
    const { blobs } = await store.list({ prefix: "item:" });
    const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return all.filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  };

  if (req.method === "GET") return json(await list());

  // Mot de passe partagé : "shuen" par défaut, ou celui de la variable ADMIN_PASSWORD si elle existe
  const expected = (process.env.ADMIN_PASSWORD || "shuen").trim().toLowerCase();
  const given = (req.headers.get("x-password") || "").trim().toLowerCase();
  if (given !== expected) return json({ error: "Mot de passe incorrect" }, 401);

  const clean = (b) => ({
    title: String(b.title || "").slice(0, 200),
    category: String(b.category || "Divers").slice(0, 60),
    content: String(b.content || "").slice(0, 60000),
    link: String(b.link || "").slice(0, 500),
    images: Array.isArray(b.images)
      ? b.images.filter((x) => typeof x === "string" && /^[\w-]+$/.test(x)).slice(0, 12)
      : [],
  });
  const id = new URL(req.url).searchParams.get("id") || "";
  const okId = /^[\w-]+$/.test(id);

  if (req.method === "POST") {
    const b = clean(await req.json());
    if (!b.title) return json({ error: "Titre requis" }, 400);
    const item = { id: crypto.randomUUID(), ...b, date: new Date().toISOString() };
    await store.setJSON("item:" + item.id, item);
    return json(await list());
  }

  if (req.method === "PUT") {
    if (!okId) return json({ error: "Identifiant invalide" }, 400);
    const old = await store.get("item:" + id, { type: "json" });
    if (!old) return json({ error: "Archive introuvable" }, 404);
    const b = clean(await req.json());
    if (!b.title) return json({ error: "Titre requis" }, 400);
    for (const img of old.images || []) if (!b.images.includes(img)) await imgStore.delete(img);
    await store.setJSON("item:" + id, { ...old, ...b, edited: new Date().toISOString() });
    return json(await list());
  }

  if (req.method === "DELETE") {
    if (!okId) return json({ error: "Identifiant invalide" }, 400);
    const old = await store.get("item:" + id, { type: "json" });
    for (const img of old?.images || []) await imgStore.delete(img);
    await store.delete("item:" + id);
    return json(await list());
  }

  return json({ error: "Méthode non supportée" }, 405);
};

export const config = { path: "/api/archive" };
