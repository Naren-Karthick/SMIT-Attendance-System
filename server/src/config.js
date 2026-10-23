const dotenv = require('dotenv');
dotenv.config();

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'smit-smart-attendance-super-secret-key-2026')) {
    errors.push('CRITICAL: JWT_SECRET must be explicitly set to a cryptographically secure random value in production.');
  }

  if (errors.length > 0) {
    console.error('=================================================================');
    console.error('CONFIGURATION ERROR: Failed startup environment validation');
    errors.forEach(err => console.error(' - ' + err));
    console.error('=================================================================');
    if (isProd) {
      throw new Error('Environment configuration failed validation.');
    }
  }

  return {
    isProduction: isProd,
    jwtSecret: process.env.JWT_SECRET || 'smit-smart-attendance-super-secret-key-2026',
    dbStorageMode: process.env.DATABASE_URL ? 'POSTGRES' : (process.env.BLOB_READ_WRITE_TOKEN ? 'VERCEL_BLOB' : 'LOCAL_SQLITE'),
    port: process.env.PORT || 5000
  };
}

module.exports = { validateEnv };
