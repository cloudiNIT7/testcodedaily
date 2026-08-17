// Cloudflare Pages Function: POST /api/login
// Requires these to be set as Pages environment variables / secrets:
//   ADMIN_USERNAME       - the admin login username
//   ADMIN_PASSWORD_HASH  - sha256 hex hash of the admin password
//   SESSION_SECRET       - random string used to derive the session token

interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { username, password } = body;
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hash = await sha256Hex(password);

  if (username === env.ADMIN_USERNAME && hash === env.ADMIN_PASSWORD_HASH) {
    const token = await sha256Hex(env.ADMIN_PASSWORD_HASH + env.SESSION_SECRET);
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};
