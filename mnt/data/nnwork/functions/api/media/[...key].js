export async function onRequestGet({ params, env }) {
  if (!env.MEDIA) return new Response('R2 is not configured', { status: 503 });
  const object = await env.MEDIA.get(params.key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag); headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
