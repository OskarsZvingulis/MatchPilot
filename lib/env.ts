const required = ['DATABASE_URL'];

if (process.env.NODE_ENV === 'production') {
  required.push(
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_SECRET_TOKEN',
    'ADMIN_USERNAME',
        'ADMIN_PASSWORD_HASH',
        'NEXTAUTH_SECRET'
  );
}

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled.');
}
if (!process.env.TELEGRAM_SECRET_TOKEN) {
  console.warn('TELEGRAM_SECRET_TOKEN not set — Telegram webhook security disabled.');
}

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_TOKEN: process.env.TELEGRAM_SECRET_TOKEN,
  WORKER_SECRET: process.env.WORKER_SECRET,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
};
