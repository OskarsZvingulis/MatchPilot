const required = ['DATABASE_URL'];

if (process.env.NODE_ENV === 'production') {
  required.push('TELEGRAM_BOT_TOKEN');
}

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled.');
}

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  WORKER_SECRET: process.env.WORKER_SECRET
};