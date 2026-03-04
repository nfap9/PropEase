import crypto from 'node:crypto';
import { config } from '../config.js';

const ALG = 'HS256';
const TYP = 'JWT';

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payload: Record<string, unknown>, expiresInMinutes: number): string {
  const header = { alg: ALG, typ: TYP };
  const now = Math.floor(Date.now() / 1000);
  const payloadWithExp = { ...payload, exp: now + expiresInMinutes * 60 };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payloadWithExp));
  const signature = crypto
    .createHmac('sha256', config.secretKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const sigB64 = base64UrlEncode(signature);
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

function verify(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', config.secretKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const expectedB64 = base64UrlEncode(expectedSig);
  if (sigB64 !== expectedB64) return null;
  try {
    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const exp = payload.exp as number | undefined;
    if (exp != null && Math.floor(Date.now() / 1000) > exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAccessToken(data: { sub: string; phone?: string }): string {
  return sign({ ...data, type: 'access' }, config.accessTokenExpireMinutes);
}

export function createRefreshToken(data: { sub: string; phone?: string }): string {
  return sign({ ...data, type: 'refresh' }, config.refreshTokenExpireDays * 24 * 60);
}

export function decodeToken(token: string): Record<string, unknown> | null {
  return verify(token);
}

export function createAdminAccessToken(adminUserId: string): string {
  return sign({ sub: adminUserId, type: 'admin' }, config.adminAccessTokenExpireMinutes);
}
