import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 保存原始环境变量
const originalEnv = { ...process.env };

describe('config', () => {
  beforeEach(() => {
    // 重置模块缓存
    vi.resetModules();
    // 清除测试相关的环境变量
    const keysToClear = [
      'NODE_ENV',
      'IS_DEV',
      'APP_NAME',
      'API_V1_PREFIX',
      'DEBUG',
      'DATABASE_URL',
      'SECRET_KEY',
      'ALGORITHM',
      'ACCESS_TOKEN_EXPIRE_MINUTES',
      'REFRESH_TOKEN_EXPIRE_DAYS',
      'ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES',
      'CORS_ORIGINS',
      'WECHAT_PAY_ENABLED',
      'WECHAT_MCH_ID',
      'WECHAT_APIV3_KEY',
      'WECHAT_APP_ID',
      'WECHAT_CERT_SERIAL_NO',
      'WECHAT_PAY_NOTIFY_URL_BASE',
      'WECHAT_PRIVATE_KEY',
      'WECHAT_PRIVATE_KEY_PATH',
      'SMS_NOTIFICATIONS_ENABLED',
      'SMS_WEBHOOK_URL',
      'SMS_WEBHOOK_TOKEN',
      'SMS_SENDER_SIGN',
    ];
    keysToClear.forEach((key) => {
      if (process.env[key] !== undefined) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('开发环境', () => {
    it('使用默认值', async () => {
      // 明确设置环境变量以测试默认值
      process.env.DEBUG = 'false';
      process.env.CORS_ORIGINS = '';

      const { config } = await import('./config.js');

      expect(config.isDev).toBe(true);
      expect(config.appName).toBe('Apartment Ultra API');
      expect(config.apiV1Prefix).toBe('/api/v1');
      expect(config.debug).toBe(false);
      expect(config.algorithm).toBe('HS256');
      expect(config.accessTokenExpireMinutes).toBe(30);
      expect(config.refreshTokenExpireDays).toBe(7);
      expect(config.adminAccessTokenExpireMinutes).toBe(30);
      expect(config.corsOrigins).toEqual(['http://localhost:3000']);
      expect(config.wechatPayEnabled).toBe(false);
    });

    it('自定义配置值', async () => {
      process.env.APP_NAME = 'Custom App';
      process.env.DEBUG = 'true';
      process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '60';

      const { config } = await import('./config.js');

      expect(config.appName).toBe('Custom App');
      expect(config.debug).toBe(true);
      expect(config.accessTokenExpireMinutes).toBe(60);
    });
  });

  describe('CORS_ORIGINS 解析', () => {
    it('解析 JSON 数组', async () => {
      process.env.CORS_ORIGINS = '["http://localhost:3000","http://localhost:3001"]';

      const { config } = await import('./config.js');

      expect(config.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:3001']);
    });

    it('通配符 "*" 返回 true', async () => {
      process.env.CORS_ORIGINS = '*';

      const { config } = await import('./config.js');

      expect(config.corsOrigins).toBe(true);
    });

    it('单个 URL 返回数组', async () => {
      process.env.CORS_ORIGINS = 'http://example.com';

      const { config } = await import('./config.js');

      expect(config.corsOrigins).toEqual(['http://example.com']);
    });

    it('空值返回默认值', async () => {
      const { config } = await import('./config.js');

      expect(config.corsOrigins).toEqual(['http://localhost:3000']);
    });
  });

  describe('生产环境安全检查', () => {
    it('SECRET_KEY 使用默认值时退出', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECRET_KEY = 'dev-secret-key-do-not-use-in-production';
      process.env.DATABASE_URL = 'postgresql://user:pass@prod-db:5432/db';
      process.env.CORS_ORIGINS = '["https://example.com"]';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(import('./config.js')).rejects.toThrow('process.exit:1');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('SECRET_KEY'));

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('SECRET_KEY 长度不足时退出', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECRET_KEY = 'too-short-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@prod-db:5432/db';
      process.env.CORS_ORIGINS = '["https://example.com"]';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(import('./config.js')).rejects.toThrow('process.exit:1');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('32'));

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('DATABASE_URL 使用本地默认值时退出', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECRET_KEY = 'this-is-a-very-long-secret-key-for-production-use-32chars';
      process.env.CORS_ORIGINS = '["https://example.com"]';
      // 不设置 DATABASE_URL，使用默认值

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(import('./config.js')).rejects.toThrow('process.exit:1');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'));

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('CORS 设置为 "*" 时退出', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECRET_KEY = 'this-is-a-very-long-secret-key-for-production-use-32chars';
      process.env.DATABASE_URL = 'postgresql://user:pass@prod-db:5432/db';
      process.env.CORS_ORIGINS = '*';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(import('./config.js')).rejects.toThrow('process.exit:1');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('CORS'));

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('生产环境配置正确时通过验证', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECRET_KEY = 'this-is-a-very-long-secret-key-for-production-use-32chars';
      process.env.DATABASE_URL = 'postgresql://user:pass@prod-db:5432/db';
      process.env.CORS_ORIGINS = '["https://example.com"]';

      const { config } = await import('./config.js');

      expect(config.isDev).toBe(false);
    });
  });

  describe('微信支付条件验证', () => {
    it('微信支付禁用时其他配置可选', async () => {
      process.env.WECHAT_PAY_ENABLED = 'false';

      const { config } = await import('./config.js');

      expect(config.wechatPayEnabled).toBe(false);
      expect(config.wechatMchId).toBeUndefined();
    });

    it('微信支付启用但配置不完整时退出', async () => {
      process.env.WECHAT_PAY_ENABLED = 'true';
      process.env.WECHAT_MCH_ID = '1234567890';
      // 缺少其他必要配置

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(import('./config.js')).rejects.toThrow('process.exit:1');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('微信支付'));

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('微信支付启用且配置完整时通过验证', async () => {
      process.env.WECHAT_PAY_ENABLED = 'true';
      process.env.WECHAT_MCH_ID = '1234567890';
      process.env.WECHAT_APP_ID = 'wx1234567890abcdef';
      process.env.WECHAT_CERT_SERIAL_NO = '1234567890ABCDEF';
      process.env.WECHAT_APIV3_KEY = 'apiv3-key-32-characters-long-123456';
      process.env.WECHAT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';

      const { config } = await import('./config.js');

      expect(config.wechatPayEnabled).toBe(true);
      expect(config.wechatMchId).toBe('1234567890');
    });

    it('微信支付使用私钥文件路径', async () => {
      process.env.WECHAT_PAY_ENABLED = 'true';
      process.env.WECHAT_MCH_ID = '1234567890';
      process.env.WECHAT_APP_ID = 'wx1234567890abcdef';
      process.env.WECHAT_CERT_SERIAL_NO = '1234567890ABCDEF';
      process.env.WECHAT_APIV3_KEY = 'apiv3-key-32-characters-long-123456';
      process.env.WECHAT_PRIVATE_KEY_PATH = '/path/to/private_key.pem';

      const { config } = await import('./config.js');

      expect(config.wechatPayEnabled).toBe(true);
      expect(config.wechatPrivateKeyPath).toBe('/path/to/private_key.pem');
    });
  });

  describe('configSchema 导出', () => {
    it('可以用于测试', async () => {
      const { configSchema } = await import('./config.js');

      const validConfig = {
        isDev: true,
        appName: 'Test App',
        apiV1Prefix: '/api/v1',
        debug: false,
        databaseUrl: 'postgresql://localhost:5432/test',
        secretKey: 'test-secret-key',
        algorithm: 'HS256' as const,
        accessTokenExpireMinutes: 30,
        refreshTokenExpireDays: 7,
        adminAccessTokenExpireMinutes: 30,
        corsOrigins: ['http://localhost:3000'],
        wechatPayEnabled: false,
        smsNotificationsEnabled: false,
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });
});
