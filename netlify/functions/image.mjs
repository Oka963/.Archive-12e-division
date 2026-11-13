import { getStore } from "@netlify/blobs";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  const store = getStore({ name: "images", consistency: "strong" });

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!/^[\w-]+$/.test(id)) return json({ error: "Identifiant invalide" }, 400);
    const r = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!r) return json({ error: "Image introuvable" }, 404);
    const type = TYPES.includes(r.metadata?.contentType) ? r.metadata.contentType : "image/jpeg";
    return new Response(r.data, {
      headers: {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (req.method === "POST") {
    const expected = (process.env.ADMIN_PASSWORD || "shuen").trim().toLowerCase();
    const given = (req.headers.get("x-password") || "").trim().toLowerCase();
    if (given !== expected) return json({ error: "Mot de passe incorrect" }, 401);

    const type = (req.headers.get("content-type") || "").split(";")[0].trim();
    if (!TYPES.includes(type)) return json({ error: "Format d'image non supporté" }, 400);
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 5.5 * 1024 * 1024) return json({ error: "Image trop lourde" }, 413);
    const id = crypto.randomUUID();
    await store.set(id, buf, { metadata: { contentType: type } });
    return json({ id });
  }

  return json({ error: "Méthode non supportée" }, 405);
};

export const config = { path: "/api/image" };
