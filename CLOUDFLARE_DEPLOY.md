# Deploying to Cloudflare Pages

This project now has:
- `src/` — React frontend (builds to static files, unchanged)
- `functions/api/login.ts` — replaces the Express `/api/login` route
- `functions/api/test-codes.ts` — replaces the Express `/api/test-codes` route (uses KV instead of `data.json`)
- `server.ts` — still there for local dev (`npm run dev`), **not used in production anymore**

## ⚠️ Do this first: rotate the admin password

The old `server.ts` had the real admin password sitting in a plain-text comment. Pick a **new** password, then generate its hash:

```bash
node scripts/hash-password.mjs "your-new-password"
```

Copy the printed hash — you'll paste it into Cloudflare as a secret below. Do not reuse `Abinash@2004@1904`.

## 1. Create a KV namespace

```bash
npm install -g wrangler   # if not already installed
wrangler login
wrangler kv namespace create TEST_CODES_KV
```

This prints an `id`. Put it into `wrangler.toml` under `[[kv_namespaces]]` (there's also a `preview_id` field — you can create a second namespace with `wrangler kv namespace create TEST_CODES_KV --preview` for that, or reuse the same id for both while testing).

## 2. Create the Pages project and connect KV

In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → connect this GitHub repo (or run `wrangler pages project create cloudinitonline` from the CLI).

Build settings:
- Build command: `npm run build`
- Build output directory: `dist`

Then go to **Settings → Functions → KV namespace bindings** and add:
- Variable name: `TEST_CODES_KV`
- KV namespace: the one you created above

## 3. Set environment variables / secrets

**Settings → Environment variables** (mark these as *secret*, not plaintext):

| Name | Value |
|---|---|
| `ADMIN_USERNAME` | `abinashkumar19` (or whatever you want) |
| `ADMIN_PASSWORD_HASH` | the hash you generated in step 0 |
| `SESSION_SECRET` | any long random string, e.g. output of `openssl rand -hex 32` |

If you also use the Gemini API elsewhere in the app, add `GEMINI_API_KEY` here too.

## 4. Deploy

```bash
npm install
npm run build
wrangler pages deploy dist
```

Or just push to the connected GitHub branch if you set up the dashboard integration — Cloudflare will build and deploy automatically on every push.

## 5. Test locally before deploying (optional)

```bash
npm run pages:dev
```

This builds the frontend and runs it through `wrangler pages dev`, which emulates the Functions + KV binding locally.

---

### What changed vs. the original code, and why

| Original | Now | Why |
|---|---|---|
| `app.listen()` Express server | Cloudflare Pages Functions (`functions/api/*.ts`) | Cloudflare Pages doesn't run a persistent Node server |
| `fs.writeFileSync('data.json', ...)` | Cloudflare KV (`TEST_CODES_KV`) | Workers have no writable local filesystem |
| Hardcoded username/password hash + plaintext password in a comment | `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` as Cloudflare secrets | The old code exposed the real password in the source |
| `node:crypto` | Web Crypto (`crypto.subtle`) | `node:crypto` isn't available in the Workers runtime |
