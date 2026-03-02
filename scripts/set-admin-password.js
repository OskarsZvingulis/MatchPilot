#!/usr/bin/env node
// Usage: node scripts/set-admin-password.js <your-password>
// Generates a bcrypt hash and writes it directly to .env.local

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/set-admin-password.js <your-password>');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env.local');

async function main() {
  const hash = await bcrypt.hash(password, 10);

  // Self-verify immediately
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    console.error('bcrypt self-test failed — something is wrong with your bcrypt installation.');
    process.exit(1);
  }

  console.log('Hash generated and self-verified OK.');

  // Base64-encode the hash so Next.js dotenv doesn't interpolate the $ chars
  const b64 = Buffer.from(hash).toString('base64');

  // Read and update .env.local
  let env = fs.readFileSync(envPath, 'utf8');

  if (/^ADMIN_PASSWORD_HASH=.*/m.test(env)) {
    env = env.replace(/^ADMIN_PASSWORD_HASH=.*/m, `ADMIN_PASSWORD_HASH=${b64}`);
  } else {
    env += `\nADMIN_PASSWORD_HASH=${b64}`;
  }

  fs.writeFileSync(envPath, env, 'utf8');
  console.log('\n.env.local updated successfully.');
  console.log('Restart your dev server and log in with this password.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
