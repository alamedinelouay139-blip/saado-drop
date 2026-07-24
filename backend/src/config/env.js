/**
 * Centralized environment configuration and validation.
 */
require('dotenv').config();

const requiredEnvs = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

for (const env of requiredEnvs) {
  if (!process.env[env] || process.env[env].trim() === '') {
    console.error(`FATAL ERROR: Environment variable ${env} is missing or empty.`);
    process.exit(1);
  }
}

// Log if ImageKit is missing and crash startup
if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  console.error('FATAL ERROR: ImageKit credentials are not fully configured in the environment.');
  process.exit(1);
}

// Helper to sanitize env vars
const cleanEnv = (val) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, '').trim().replace(/\n|\r/g, '');
};

if (cleanEnv(process.env.JWT_SECRET) === 'replace_with_a_long_random_secret') {
  console.error(`FATAL ERROR: JWT_SECRET must be securely changed from the default placeholder.`);
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 5,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  MAX_IMAGE_SIZE_MB: process.env.MAX_IMAGE_SIZE_MB ? Number(process.env.MAX_IMAGE_SIZE_MB) : 5,
  IMAGEKIT_PUBLIC_KEY: cleanEnv(process.env.IMAGEKIT_PUBLIC_KEY),
  IMAGEKIT_PRIVATE_KEY: cleanEnv(process.env.IMAGEKIT_PRIVATE_KEY),
  IMAGEKIT_URL_ENDPOINT: cleanEnv(process.env.IMAGEKIT_URL_ENDPOINT)
};
