/**
 * Centralised, validated access to environment variables.
 * Rest of the codebase must read env through this module only.
 */

export type ContentMode = 'sanity' | 'local';

function resolveContentMode(): ContentMode {
  const raw = (process.env.CONTENT_MODE ?? 'auto').toLowerCase();
  if (raw === 'sanity') return 'sanity';
  if (raw === 'local') return 'local';
  // auto
  return process.env.SANITY_PROJECT_ID ? 'sanity' : 'local';
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID || '',
    dataset: process.env.SANITY_DATASET || 'production',
    useCdn: process.env.SANITY_USE_CDN !== 'false',
    apiVersion: '2025-05-05',
    studioUrl: process.env.SANITY_STUDIO_URL || '',
  },
  dataDir: process.env.DATA_DIR || './data',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '',
    sessionSecret: process.env.ADMIN_SESSION_SECRET || '',
  },
  business: {
    phone: process.env.BUSINESS_PHONE || '+91 90354 62874',
    whatsapp: process.env.BUSINESS_WHATSAPP || '919035462874',
  },
  // `||` (not `??`) so a variable created BLANK in the host's env settings
  // still falls back instead of crashing `new URL('')`.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/** Which content source the website uses right now. */
export function getContentMode(): ContentMode {
  return resolveContentMode();
}

export type AdminSecrets = {
  username: string;
  password: string;
  sessionSecret: string;
};

/** Throws a readable error when admin auth env is missing/misconfigured. */
export function requireAdminSecrets(): AdminSecrets {
  const { username, password, sessionSecret } = env.admin;
  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Add it to your environment (see .env.example).',
    );
  }
  if (sessionSecret.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be at least 16 characters. Generate one with: openssl rand -hex 32',
    );
  }
  return { username, password, sessionSecret };
}
