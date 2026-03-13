import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuthService,
  type AuthService,
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
    service = createAuthService(() => mockAuthRepo);
    // Setup default mock returns - must be after clearAllMocks
    vi.mocked(createAccessToken).mockReturnValue('access_token_123');
    vi.mocked(createRefreshToken).mockReturnValue('refresh_token_123');
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      phone: '13800138000',
      full_name: '测试用户',
      password: 'password123',
    };

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

    it('should throw error when user not found', async () => {
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
});
