export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return new Response(JSON.stringify({ error: 'R2 is not configured yet.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return new Response('Missing file', { status: 400 });
  const ext = (file.name.split('.').pop() || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 8);
  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  const origin = new URL(request.url).origin;
  return Response.json({ url: `${origin}/api/media/${key}` });
}
