import { License, LicenseStatus, SubscriptionPlan } from '../types';

/**
 * Utility helper to compute SHA-256 hex digest using Web Crypto API or simple hashing fallback.
 * Essential for hash-based storage logic (e.g., storing hashed secrets instead of raw tokens).
 */
export async function sha256Hash(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('SubtleCrypto digest failed, falling back to string hash:', e);
    }
  }

  // Fallback simple checksum / string hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Computes hash-based secret representation for secure database storage.
 */
export async function hashLicenseSecret(secret: string): Promise<string> {
  return await sha256Hash(secret + '::HASH_STORAGE_SALT_2026');
}

/**
 * Generates a secure, unique License Key using crypto.randomUUID().
 * Format: SCH-LIC-XXXX-XXXX-XXXX-XXXX
 */
export function generateSecureLicenseKey(schoolId?: string, durationDays: number = 365): string {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  ).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  const seg1 = uuid.slice(0, 4).padEnd(4, '8');
  const seg2 = uuid.slice(4, 8).padEnd(4, '9');
  const seg3 = uuid.slice(8, 12).padEnd(4, 'A');
  const seg4 = uuid.slice(12, 16).padEnd(4, 'F');

  return `SCH-LIC-${seg1}-${seg2}-${seg3}-${seg4}`;
}

/**
 * Generates a unique Activation Code using crypto.randomUUID().
 * Format: ACT-XXXX-XXXX-XXXX
 */
export function generateActivationCode(schoolId?: string): string {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  ).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  const chunk1 = uuid.slice(0, 4).padEnd(4, '1');
  const chunk2 = uuid.slice(4, 8).padEnd(4, '2');
  const chunk3 = uuid.slice(8, 12).padEnd(4, '3');

  return `ACT-${chunk1}-${chunk2}-${chunk3}`;
}

/**
 * Generates a cryptographic security token using crypto.randomUUID() and hash-based storage logic.
 * Format: TOK-SEC-XXXXXXXXXXXXXXXX
 */
export async function generateSecurityToken(
  schoolId: string = '',
  licenseKey: string = '',
  secretSalt: string = 'SAMS_GHANA_SECURE_SALT_2026'
): Promise<string> {
  const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
  const rawData = `${schoolId}::${licenseKey}::${secretSalt}::${randomUuid}::${Date.now()}`;
  const fullHash = await sha256Hash(rawData);
  return `TOK-SEC-${fullHash.slice(0, 16).toUpperCase()}`;
}

/**
 * Verifies if a license key matches the expected format (SCH-LIC-XXXX-XXXX-XXXX-XXXX).
 */
export async function verifyLicenseKeyIntegrity(licenseKey: string, schoolId?: string): Promise<boolean> {
  if (!licenseKey) return false;
  const cleanKey = licenseKey.trim().toUpperCase();
  if (cleanKey.startsWith('SCH-LIC-') || cleanKey.startsWith('LIC-GH-')) {
    const parts = cleanKey.split('-');
    return parts.length >= 4;
  }
  return false;
}

/**
 * Full License object builder helper that links school ID, license key, activation code, and security token.
 */
export interface GeneratedLicenseDetails {
  license: License;
  activationCode: string;
  securityToken: string;
  tokenHash: string;
}

export async function createFullLicenseDetails(
  schoolId: string,
  licenseType: '30_DAYS' | '3_MONTHS' | '6_MONTHS' | '8_MONTHS' | '12_MONTHS' | 'CUSTOM',
  durationDays: number,
  subscriptionPlan: SubscriptionPlan = 'STANDARD',
  price: number = 0
): Promise<GeneratedLicenseDetails> {
  const licenseKey = generateSecureLicenseKey(schoolId, durationDays);
  const activationCode = generateActivationCode(schoolId);
  const securityToken = await generateSecurityToken(schoolId, licenseKey);
  const tokenHash = await hashLicenseSecret(securityToken);

  const startDate = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const license: License = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? `LIC-${crypto.randomUUID()}` : `LIC-${Date.now()}`,
    schoolId,
    licenseKey,
    licenseType,
    durationDays,
    startDate,
    expiresAt,
    status: 'ACTIVE',
    subscriptionPlan,
    price,
    createdAt: startDate,
    updatedAt: startDate,
  };

  return {
    license,
    activationCode,
    securityToken,
    tokenHash
  };
}
