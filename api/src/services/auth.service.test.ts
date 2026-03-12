import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAuthService,
  type AuthService,
  verificationCodeStore,
  type RegisterInput,
  type LoginInput,
} from './auth.service.js';
import type { AuthRepository } from '../repositories/auth.repo.js';
import type { User } from '@prisma/client';

// Mock dependencies
vi.mock('../utils/security.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password_123'),
  verifyPassword: vi.fn(),
}));

vi.mock('../utils/jwt.js', () => ({
  createAccessToken: vi.fn(),
  createRefreshToken: vi.fn(),
  decodeToken: vi.fn(),
}));

vi.mock('../services/createPersonalOrgWithFreePlan.js', () => ({
  createPersonalOrgWithFreePlan: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config.js', () => ({
  config: {
    isDev: true,
  },
}));

import { hashPassword, verifyPassword } from '../utils/security.js';
import { decodeToken, createAccessToken, createRefreshToken } from '../utils/jwt.js';
import { createPersonalOrgWithFreePlan } from './createPersonalOrgWithFreePlan.js';

describe('AuthService', () => {
  const mockAuthRepo: AuthRepository = {
    findUserByPhone: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  };

  let service: AuthService;

  const sampleUser: User = {
    id: '01hqtestuser0000001',
    phone: '13800138000',
    full_name: '测试用户',
    password_hash: 'hashed_password',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    verificationCodeStore.clear();
    service = createAuthService(() => mockAuthRepo);
    // Setup default mock returns - must be after clearAllMocks
    vi.mocked(createAccessToken).mockReturnValue('access_token_123');
    vi.mocked(createRefreshToken).mockReturnValue('refresh_token_123');
  });

  afterEach(() => {
    verificationCodeStore.clear();
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      phone: '13800138000',
      full_name: '测试用户',
      password: 'password123',
      verification_code: '123456',
    };

    it('should throw error when verification code is empty', async () => {
      const input = { ...registerInput, verification_code: '' };

      await expect(service.register(input)).rejects.toMatchObject({
        statusCode: 400,
        message: '验证码不能为空',
      });
    });

    it('should throw error when phone already registered', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);

      await expect(service.register(registerInput)).rejects.toMatchObject({
        statusCode: 400,
        message: '手机号已注册',
      });
    });

    it('should register user successfully', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(null);
      vi.mocked(mockAuthRepo.createUser).mockResolvedValue(sampleUser);
      vi.mocked(hashPassword).mockResolvedValue('hashed_password_123');

      const result = await service.register(registerInput);

      expect(mockAuthRepo.findUserByPhone).toHaveBeenCalledWith('13800138000');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(mockAuthRepo.createUser).toHaveBeenCalled();
      expect(createPersonalOrgWithFreePlan).toHaveBeenCalledWith(sampleUser.id);
      expect(result).toEqual({
        id: sampleUser.id,
        phone: sampleUser.phone,
        full_name: sampleUser.full_name,
        is_active: sampleUser.is_active,
        created_at: sampleUser.created_at,
      });
    });
  });

  describe('login', () => {
    const passwordLoginInput: LoginInput = {
      phone: '13800138000',
      password: 'password123',
    };

    const codeLoginInput: LoginInput = {
      phone: '13800138000',
      verification_code: '123456',
    };

    it('should throw error when user not found (password login)', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(null);

      await expect(service.login(passwordLoginInput)).rejects.toMatchObject({
        statusCode: 401,
        message: '手机号或密码错误',
      });
    });

    it('should throw error when password is wrong', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(service.login(passwordLoginInput)).rejects.toMatchObject({
        statusCode: 401,
        message: '手机号或密码错误',
      });
    });

    it('should throw error when verification code is invalid', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
      const input: LoginInput = {
        phone: '13800138000',
        verification_code: '654321',
      };

      // No code stored
      await expect(service.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: '验证码无效或已过期',
      });
    });

    it('should throw error when user is inactive', async () => {
      const inactiveUser = { ...sampleUser, is_active: false };
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(inactiveUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      await expect(service.login(passwordLoginInput)).rejects.toMatchObject({
        statusCode: 401,
        message: '账号已停用或不允许登录',
      });
    });

    it('should login successfully with password', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const result = await service.login(passwordLoginInput);

      expect(verifyPassword).toHaveBeenCalledWith('password123', sampleUser.password_hash);
      expect(result).toEqual({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        token_type: 'bearer',
      });
    });

    it('should login successfully with verification code (test code)', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);

      const result = await service.login(codeLoginInput);

      expect(result).toEqual({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        token_type: 'bearer',
      });
    });

    it('should login successfully with stored verification code', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
      // Store a valid verification code
      verificationCodeStore.set('13800138000', {
        code: '888888',
        expiresAt: Date.now() + 60000,
        purpose: 'login',
      });

      const input: LoginInput = {
        phone: '13800138000',
        verification_code: '888888',
      };

      const result = await service.login(input);

      expect(result).toEqual({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        token_type: 'bearer',
      });

      // Code should be deleted after use
      expect(verificationCodeStore.has('13800138000')).toBe(false);
    });

    it('should throw error when stored code is expired', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
      // Store an expired verification code
      verificationCodeStore.set('13800138000', {
        code: '888888',
        expiresAt: Date.now() - 1000, // Expired
        purpose: 'login',
      });

      const input: LoginInput = {
        phone: '13800138000',
        verification_code: '888888',
      };

      await expect(service.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: '验证码无效或已过期',
      });
    });
  });

  describe('refreshToken', () => {
    it('should throw error when token is invalid', async () => {
      vi.mocked(decodeToken).mockReturnValue(null);

      await expect(service.refreshToken('invalid_token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Could not validate credentials',
      });
    });

    it('should throw error when token type is not refresh', async () => {
      vi.mocked(decodeToken).mockReturnValue({ sub: 'user_id', type: 'access' });

      await expect(service.refreshToken('access_token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Could not validate credentials',
      });
    });

    it('should throw error when user not found', async () => {
      vi.mocked(decodeToken).mockReturnValue({ sub: 'user_id', type: 'refresh' });
      vi.mocked(mockAuthRepo.findUserById).mockResolvedValue(null);

      await expect(service.refreshToken('refresh_token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Could not validate credentials',
      });
    });

    it('should throw error when user is inactive', async () => {
      vi.mocked(decodeToken).mockReturnValue({ sub: sampleUser.id, type: 'refresh' });
      vi.mocked(mockAuthRepo.findUserById).mockResolvedValue({ ...sampleUser, is_active: false });

      await expect(service.refreshToken('refresh_token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Could not validate credentials',
      });
    });

    it('should return new tokens on success', async () => {
      vi.mocked(decodeToken).mockReturnValue({ sub: sampleUser.id, type: 'refresh' });
      vi.mocked(mockAuthRepo.findUserById).mockResolvedValue(sampleUser);

      const result = await service.refreshToken('refresh_token');

      expect(result).toEqual({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        token_type: 'bearer',
      });
    });
  });

  describe('getUserById', () => {
    it('should return null when user not found', async () => {
      vi.mocked(mockAuthRepo.findUserById).mockResolvedValue(null);

      const result = await service.getUserById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return user info when found', async () => {
      vi.mocked(mockAuthRepo.findUserById).mockResolvedValue(sampleUser);

      const result = await service.getUserById(sampleUser.id);

      expect(result).toEqual({
        id: sampleUser.id,
        phone: sampleUser.phone,
        full_name: sampleUser.full_name,
        is_active: sampleUser.is_active,
        created_at: sampleUser.created_at,
      });
    });
  });

  describe('validateVerificationCode', () => {
    it('should return false when phone is not provided', () => {
      const result = service.validateVerificationCode('123456');
      expect(result).toBe(false);
    });

    it('should return false when code is not stored', () => {
      const result = service.validateVerificationCode('123456', '13800138000');
      expect(result).toBe(false);
    });

    it('should return false when code does not match', () => {
      verificationCodeStore.set('13800138000', {
        code: '888888',
        expiresAt: Date.now() + 60000,
        purpose: 'login',
      });

      const result = service.validateVerificationCode('123456', '13800138000');
      expect(result).toBe(false);
    });

    it('should return false when code is expired', () => {
      verificationCodeStore.set('13800138000', {
        code: '123456',
        expiresAt: Date.now() - 1000, // Expired
        purpose: 'login',
      });

      const result = service.validateVerificationCode('123456', '13800138000');
      expect(result).toBe(false);
    });

    it('should return true and delete code when valid', () => {
      verificationCodeStore.set('13800138000', {
        code: '123456',
        expiresAt: Date.now() + 60000,
        purpose: 'login',
      });

      const result = service.validateVerificationCode('123456', '13800138000');
      expect(result).toBe(true);
      expect(verificationCodeStore.has('13800138000')).toBe(false);
    });
  });
});
