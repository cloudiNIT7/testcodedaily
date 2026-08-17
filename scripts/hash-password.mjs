// Usage: node scripts/hash-password.mjs "your-new-password"
// Prints the sha256 hex hash to set as the ADMIN_PASSWORD_HASH secret in Cloudflare Pages.
import { createHash } from 'crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-new-password"');
  process.exit(1);
}

console.log(createHash('sha256').update(password).digest('hex'));
