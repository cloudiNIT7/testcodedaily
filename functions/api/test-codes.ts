// Cloudflare Pages Function: GET/POST /api/test-codes
// Requires a KV namespace binding named TEST_CODES_KV (set in Pages > Settings > Functions > KV namespace bindings)
// Requires the same ADMIN_PASSWORD_HASH and SESSION_SECRET env vars as login.ts

interface Env {
  TEST_CODES_KV: KVNamespace;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
}

const DATA_KEY = 'test-codes';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_DATA = {
  '7:30 am': { code: 'Pending', updatedAt: 0 },
  '9:00 am': { code: 'Pending', updatedAt: 0 },
  '10:30 am': { code: 'Pending', updatedAt: 0 },
  '7:30 pm': { code: 'Pending', updatedAt: 0 },
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Returns a copy of the data where any entry older than 24 hours
// has its code replaced with "Not updated" (the stored value itself is untouched).
function withExpiry(data: Record<string, { code: string; updatedAt: number }>) {
  const now = Date.now();
  const result: Record<string, { code: string; updatedAt: number }> = {};
  for (const [batch, entry] of Object.entries(data)) {
    const isExpired = entry.updatedAt !== 0 && now - entry.updatedAt > EXPIRY_MS;
    result[batch] = isExpired
      ? { code: 'Not updated', updatedAt: entry.updatedAt }
      : entry;
  }
  return result;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const stored = (await env.TEST_CODES_KV.get(DATA_KEY, 'json')) as Record<
    string,
    { code: string; updatedAt: number }
  > | null;
  const data = stored ?? DEFAULT_DATA;
  return new Response(JSON.stringify(withExpiry(data)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authHeader = request.headers.get('authorization');
  const expectedToken = await sha256Hex(env.ADMIN_PASSWORD_HASH + env.SESSION_SECRET);

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let newCodes: Record<string, unknown>;
  try {
    newCodes = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid data format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof newCodes !== 'object' || newCodes === null) {
    return new Response(JSON.stringify({ error: 'Invalid data format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stored = (await env.TEST_CODES_KV.get(DATA_KEY, 'json')) as Record<string, any> | null;
  const currentData = stored ?? { ...DEFAULT_DATA };
  const now = Date.now();

  for (const [batch, code] of Object.entries(newCodes)) {
    if (typeof code === 'string') {
      currentData[batch] = { code, updatedAt: now };
    }
  }

  await env.TEST_CODES_KV.put(DATA_KEY, JSON.stringify(currentData));

  return new Response(JSON.stringify({ success: true, data: currentData }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
