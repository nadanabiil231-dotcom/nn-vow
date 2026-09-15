export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Invitation API
    if (path.startsWith('/api/invitations/')) {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: 'D1 is not configured yet.' }),
          { status: 503, headers: { 'content-type': 'application/json' } }
        );
      }

      const slug = decodeURIComponent(path.split('/').pop());

      if (request.method === 'GET') {
        const row = await env.DB
          .prepare('SELECT payload FROM invitations WHERE slug = ?')
          .bind(slug)
          .first();

        if (!row) return new Response('Not found', { status: 404 });

        return new Response(row.payload, {
          headers: { 'content-type': 'application/json' }
        });
      }

      if (request.method === 'PUT') {
        const input = await request.json();

        await env.DB
          .prepare('UPDATE invitations SET payload = ? WHERE slug = ?')
          .bind(JSON.stringify(input), slug)
          .run();

        return Response.json(input);
      }
    }

    // Create invitation
    if (path === '/api/invitations' && request.method === 'POST') {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: 'D1 is not configured yet.' }),
          { status: 503, headers: { 'content-type': 'application/json' } }
        );
      }

      const input = await request.json();

      const base =
        String(
          input.slug ||
          `${input.groom || 'groom'}-${input.bride || 'bride'}`
        )
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 70) || 'invitation';

      let slug = base;

      const exists = await env.DB
        .prepare('SELECT slug FROM invitations WHERE slug = ?')
        .bind(slug)
        .first();

      if (exists) {
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const payload = { ...input, slug, shareUrl: `/i/${slug}` };

      await env.DB
        .prepare(
          'INSERT INTO invitations (slug, payload, created_at) VALUES (?, ?, ?)'
        )
        .bind(slug, JSON.stringify(payload), new Date().toISOString())
        .run();

      return Response.json(payload, { status: 201 });
    }

    /* N&N VOW SHARED FEEDBACK API */

// Submit guest feedback
if (path === '/api/feedback' && request.method === 'POST') {
  if (!env.DB) {
    return Response.json(
      { error: 'D1 is not configured yet.' },
      { status: 503 }
    );
  }

  try {
    const input = await request.json();

    const name = String(input.name || '').trim().slice(0, 80);
    const message = String(input.message || '').trim().slice(0, 1000);
    const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));

    if (!message) {
      return Response.json(
        { error: 'Feedback message is required.' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO feedback (id, name, message, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(id, name || 'Anonymous', message, rating, createdAt)
      .run();

    return Response.json(
      {
        id,
        name: name || 'Anonymous',
        message,
        rating,
        created_at: createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: 'Unable to save feedback.' },
      { status: 500 }
    );
  }
}

// Get all guest feedback
if (path === '/api/feedback' && request.method === 'GET') {
  if (!env.DB) {
    return Response.json(
      { error: 'D1 is not configured yet.' },
      { status: 503 }
    );
  }

  try {
    const result = await env.DB.prepare(
      'SELECT id, name, message, rating, created_at FROM feedback ORDER BY created_at DESC'
    ).all();

    return Response.json({
      feedback: result.results || []
    });
  } catch (error) {
    return Response.json(
      { error: 'Unable to load feedback.' },
      { status: 500 }
    );
  }
}
// Media upload
    if (path === '/api/media' && request.method === 'POST') {
      if (!env.MEDIA) {
        return new Response(
          JSON.stringify({ error: 'R2 is not configured yet.' }),
          { status: 503, headers: { 'content-type': 'application/json' } }
        );
      }

      const form = await request.formData();
      const file = form.get('file');

      if (!(file instanceof File)) {
        return new Response('Missing file', { status: 400 });
      }

      const ext = (file.name.split('.').pop() || 'bin')
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 8);

      const key = `uploads/${crypto.randomUUID()}.${ext}`;

      await env.MEDIA.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream'
        }
      });

      return Response.json({
        url: `${url.origin}/api/media/${key}`
      });
    }

    // Media retrieval
    if (path.startsWith('/api/media/')) {
      if (!env.MEDIA) {
        return new Response('R2 is not configured', { status: 503 });
      }

      const key = decodeURIComponent(
        path.replace('/api/media/', '')
      );

      const object = await env.MEDIA.get(key);

      if (!object) {
        return new Response('Not found', { status: 404 });
      }

      const headers = new Headers();

      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set(
        'cache-control',
        'public, max-age=31536000, immutable'
      );

      return new Response(object.body, { headers });
    }

    // Website / React app
    return env.ASSETS.fetch(request);
  }
};
