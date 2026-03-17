import 'dotenv/config';
import { z } from 'zod';

// ============================================
// Zod Schema 定义
// ============================================

const configSchema = z.object({
  /** 是否开发环境 */
  isDev: z.boolean(),
  /** 应用名称 */
  appName: z.string().min(1),
  /** API v1 前缀 */
  apiV1Prefix: z.string().startsWith('/'),
  /** 调试模式 */
  debug: z.boolean(),
  /** 数据库连接 URL */
  databaseUrl: z.string().min(1),
  /** JWT 签名密钥 */
  secretKey: z.string().min(1),
  /** JWT 算法 */
  algorithm: z.literal('HS256'),
  /** 访问令牌过期时间（分钟） */
  accessTokenExpireMinutes: z.number().int().positive(),
  /** 刷新令牌过期时间（天） */
  refreshTokenExpireDays: z.number().int().positive(),
  /** 管理员访问令牌过期时间（分钟） */
  adminAccessTokenExpireMinutes: z.number().int().positive(),
  /** CORS 允许的来源 */
  corsOrigins: z.union([z.literal(true), z.array(z.string())]),
  /** 微信支付是否启用 */
  wechatPayEnabled: z.boolean(),
  /** 微信商户号 */
  wechatMchId: z.string().optional(),
  /** 微信支付 APIv3 密钥 */
  wechatApiv3Key: z.string().optional(),
  /** 微信 App ID */
  wechatAppId: z.string().optional(),
  /** 微信证书序列号 */
  wechatCertSerialNo: z.string().optional(),
  /** 微信支付回调 URL 基础地址 */
  wechatPayNotifyUrlBase: z.string().optional(),
  /** 微信私钥内容 */
  wechatPrivateKey: z.string().optional(),
  /** 微信私钥文件路径 */
  wechatPrivateKeyPath: z.string().optional(),
  /** 是否启用租客短信触达 */
  smsNotificationsEnabled: z.boolean(),
  /** 短信网关 Webhook 地址 */
  smsWebhookUrl: z.string().optional(),
  /** 短信网关鉴权 Token */
  smsWebhookToken: z.string().optional(),
  /** 短信签名 */
  smsSenderSign: z.string().optional(),
}).refine(
  (data) => {
    // 当启用微信支付时，必须配置必要字段
    if (!data.wechatPayEnabled) return true;
    return !!(
      data.wechatMchId &&
      data.wechatAppId &&
      data.wechatCertSerialNo &&
      data.wechatApiv3Key &&
      (data.wechatPrivateKey || data.wechatPrivateKeyPath)
    );
  },
  {
    message: '启用微信支付时，必须配置: WECHAT_MCH_ID, WECHAT_APP_ID, WECHAT_CERT_SERIAL_NO, WECHAT_APIV3_KEY 和私钥 (WECHAT_PRIVATE_KEY 或 WECHAT_PRIVATE_KEY_PATH)',
  }
).refine(
  (data) => {
    if (!data.smsNotificationsEnabled) return true;
    return !!data.smsWebhookUrl;
  },
  {
    message: '启用短信触达时，必须配置 SMS_WEBHOOK_URL',
  }
);

// ============================================
// 环境变量解析辅助函数
// ============================================

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

function envCorsOrigins(): string[] | true {
  const v = process.env.CORS_ORIGINS;
  // 通配符 "*" 表示允许所有来源（仅用于开发环境）
  if (v === '*') return true;
  if (!v || v === '') return ['http://localhost:3000'];
  try {
    const parsed = JSON.parse(v) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [v];
  } catch {
    return [v];
  }
}

// ============================================
// 配置加载与验证
// ============================================

function buildRawConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDev = !isProduction || envBool('IS_DEV', false);

  return {
    isDev,
    appName: envStr('APP_NAME', 'Apartment Ultra API'),
    apiV1Prefix: envStr('API_V1_PREFIX', '/api/v1'),
    debug: envBool('DEBUG', false),
    databaseUrl: envStr(
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5432/apartment_ultra'
    ),
    secretKey: envStr('SECRET_KEY', 'dev-secret-key-do-not-use-in-production'),
    algorithm: 'HS256' as const,
    accessTokenExpireMinutes: envInt('ACCESS_TOKEN_EXPIRE_MINUTES', 30),
    refreshTokenExpireDays: envInt('REFRESH_TOKEN_EXPIRE_DAYS', 7),
    adminAccessTokenExpireMinutes: envInt('ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES', 30),
    corsOrigins: envCorsOrigins(),
    wechatPayEnabled: envBool('WECHAT_PAY_ENABLED', false),
    wechatMchId: envStr('WECHAT_MCH_ID', '') || undefined,
    wechatApiv3Key: envStr('WECHAT_APIV3_KEY', '') || undefined,
    wechatAppId: envStr('WECHAT_APP_ID', '') || undefined,
    wechatCertSerialNo: envStr('WECHAT_CERT_SERIAL_NO', '') || undefined,
    wechatPayNotifyUrlBase: envStr('WECHAT_PAY_NOTIFY_URL_BASE', '') || undefined,
    wechatPrivateKey: envStr('WECHAT_PRIVATE_KEY', '') || undefined,
    wechatPrivateKeyPath: envStr('WECHAT_PRIVATE_KEY_PATH', '') || undefined,
    smsNotificationsEnabled: envBool('SMS_NOTIFICATIONS_ENABLED', false),
    smsWebhookUrl: envStr('SMS_WEBHOOK_URL', '') || undefined,
    smsWebhookToken: envStr('SMS_WEBHOOK_TOKEN', '') || undefined,
    smsSenderSign: envStr('SMS_SENDER_SIGN', '') || undefined,
  };
}

function validateProductionSecurity(rawConfig: ReturnType<typeof buildRawConfig>): void {
  const errors: string[] = [];

  // SECRET_KEY 安全检查
  if (rawConfig.secretKey === 'dev-secret-key-do-not-use-in-production') {
    errors.push('SECRET_KEY 不能使用开发默认值，请设置生产环境密钥（至少 32 个字符）');
  } else if (rawConfig.secretKey.length < 32) {
    errors.push('SECRET_KEY 长度必须至少 32 个字符');
  }

  // DATABASE_URL 安全检查
  if (rawConfig.databaseUrl.includes('postgres:postgres@localhost')) {
    errors.push('DATABASE_URL 不能使用本地开发默认值');
  }

  // CORS 安全检查
  if (rawConfig.corsOrigins === true) {
    errors.push('生产环境 CORS_ORIGINS 不能设置为 "*"，请指定允许的域名');
  }

  if (errors.length > 0) {
    console.error('\n[配置错误] 生产环境安全检查失败:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\n请检查环境变量配置后重试。\n');
    process.exit(1);
  }
}

function loadAndValidateConfig() {
  const rawConfig = buildRawConfig();

  // 生产环境安全检查
  if (!rawConfig.isDev) {
    validateProductionSecurity(rawConfig);
  }

  // Zod schema 验证
  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('\n[配置错误] 环境变量验证失败:');
    const formatted = result.error.flatten();

    // 字段级错误
    Object.entries(formatted.fieldErrors).forEach(([field, errors]) => {
      if (errors) {
        console.error(`  - ${field}: ${errors.join(', ')}`);
      }
    });

    // 表单级错误（如 refine 验证失败）
    formatted.formErrors.forEach((err) => {
      console.error(`  - ${err}`);
    });

    console.error('\n请检查 .env 文件或环境变量配置后重试。\n');
    process.exit(1);
  }

  return result.data;
}

// ============================================
// 导出
// ============================================

/** 配置类型，由 Zod schema 自动推导 */
export type Config = z.infer<typeof configSchema>;

/** 应用配置（启动时验证） */
export const config: Config = loadAndValidateConfig();

/** 导出 schema 供测试使用 */
export { configSchema };
