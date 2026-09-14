export async function onRequestGet({ params, env }) {
  if (!env.DB) return new Response('D1 is not configured', { status: 503 });
  const row = await env.DB.prepare('SELECT payload FROM invitations WHERE slug = ?').bind(params.slug).first();
  if (!row) return new Response('Not found', { status: 404 });
  return Response.json(JSON.parse(row.payload));
}
export async function onRequestPut({ request, params, env }) {
  if (!env.DB) return new Response('D1 is not configured', { status: 503 });
  const input = await request.json();
  await env.DB.prepare('UPDATE invitations SET payload = ? WHERE slug = ?').bind(JSON.stringify(input), params.slug).run();
  return Response.json(input);
}
