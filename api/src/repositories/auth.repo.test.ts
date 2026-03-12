import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthRepository, type AuthRepository } from './auth.repo.js';
import type { User } from '@prisma/client';

describe('AuthRepository', () => {
  // Mock PrismaClient
  const mockUser = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };

  const mockDb = { user: mockUser } as unknown as Parameters<typeof createAuthRepository>[0];
  let repo: AuthRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createAuthRepository(mockDb);
  });

  const sampleUser: User = {
    id: '01HQTESTUSER0000001',
    phone: '13800138000',
    full_name: '测试用户',
    password_hash: 'hashed_password',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  describe('findUserByPhone', () => {
    it('should return user by phone', async () => {
      mockUser.findUnique.mockResolvedValue(sampleUser);

      const result = await repo.findUserByPhone('13800138000');

      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { phone: '13800138000' },
      });
      expect(result).toEqual(sampleUser);
    });

    it('should return null if user not found', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const result = await repo.findUserByPhone('99999999999');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return user by id', async () => {
      mockUser.findUnique.mockResolvedValue(sampleUser);

      const result = await repo.findUserById('01HQTESTUSER0000001');

      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { id: '01HQTESTUSER0000001' },
      });
      expect(result).toEqual(sampleUser);
    });

    it('should return null if user not found', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const result = await repo.findUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with data', async () => {
      const createInput = {
        id: '01HQTESTUSER0000001',
        phone: '13800138000',
        full_name: '测试用户',
        password_hash: 'hashed_password',
      };
      mockUser.create.mockResolvedValue(sampleUser);

      const result = await repo.createUser(createInput);

      expect(mockUser.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleUser);
    });

    it('should create user with minimal data', async () => {
      const minimalInput = {
        phone: '13900139000',
        password_hash: 'hashed_password',
      };
      const minimalUser: User = {
        id: '01HQTESTUSER0000002',
        phone: '13900139000',
        full_name: null,
        password_hash: 'hashed_password',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockUser.create.mockResolvedValue(minimalUser);

      const result = await repo.createUser(minimalInput);

      expect(mockUser.create).toHaveBeenCalledWith({ data: minimalInput });
      expect(result.phone).toBe('13900139000');
      expect(result.full_name).toBeNull();
    });
  });
});
