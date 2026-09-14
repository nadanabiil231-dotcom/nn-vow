export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response(JSON.stringify({ error: 'D1 is not configured yet.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  const input = await request.json();
  const base = String(input.slug || `${input.groom || 'groom'}-${input.bride || 'bride'}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'invitation';
  let slug = base;
  const exists = await env.DB.prepare('SELECT slug FROM invitations WHERE slug = ?').bind(slug).first();
  if (exists) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  const payload = { ...input, slug, shareUrl: `/i/${slug}` };
  await env.DB.prepare('INSERT INTO invitations (slug, payload, created_at) VALUES (?, ?, ?)').bind(slug, JSON.stringify(payload), new Date().toISOString()).run();
  return Response.json(payload, { status: 201 });
}
