function envStr(key: string, defaultValue: string): string {
  const v = process.env[key];
  return v !== undefined && v !== '' ? v : defaultValue;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  return v.toLowerCase() === 'true' || v === '1';
}

function envInt(key: string, defaultValue: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? defaultValue : n;
}

function envCorsOrigins(): string[] {
  const v = process.env.CORS_ORIGINS;
  if (!v || v === '') return ['http://localhost:3000'];
  try {
    const parsed = JSON.parse(v) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [v];
  } catch {
    return [v];
  }
}

export const config = {
  appName: envStr('APP_NAME', 'Apartment Ultra API'),
  apiV1Prefix: envStr('API_V1_PREFIX', '/api/v1'),
  debug: envBool('DEBUG', false),
  databaseUrl: envStr('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/apartment_ultra'),
  secretKey: envStr('SECRET_KEY', 'dev-secret-key-do-not-use-in-production'),
  algorithm: envStr('ALGORITHM', 'HS256') as 'HS256',
  accessTokenExpireMinutes: envInt('ACCESS_TOKEN_EXPIRE_MINUTES', 30),
  refreshTokenExpireDays: envInt('REFRESH_TOKEN_EXPIRE_DAYS', 7),
  adminAccessTokenExpireMinutes: envInt('ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES', 30),
  corsOrigins: envCorsOrigins(),
  adminInitUsername: envStr('ADMIN_INIT_USERNAME', 'admin'),
  adminInitPassword: envStr('ADMIN_INIT_PASSWORD', 'Admin@123456'),
  wechatPayEnabled: envBool('WECHAT_PAY_ENABLED', false),
  wechatMchId: envStr('WECHAT_MCH_ID', ''),
  wechatApiv3Key: envStr('WECHAT_APIV3_KEY', ''),
  wechatAppId: envStr('WECHAT_APP_ID', ''),
  wechatCertSerialNo: envStr('WECHAT_CERT_SERIAL_NO', ''),
  wechatPayNotifyUrlBase: envStr('WECHAT_PAY_NOTIFY_URL_BASE', ''),
  wechatPrivateKey: envStr('WECHAT_PRIVATE_KEY', ''),
  wechatPrivateKeyPath: envStr('WECHAT_PRIVATE_KEY_PATH', ''),
};
