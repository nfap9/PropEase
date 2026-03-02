import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword } from './security.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('security', () => {
  beforeEach(() => {
    vi.mocked(bcrypt.hash).mockReset();
    vi.mocked(bcrypt.compare).mockReset();
  });

  describe('hashPassword', () => {
    it('returns hashed string from bcrypt.hash', async () => {
      (vi.mocked(bcrypt.hash) as unknown as { mockResolvedValue: (v: string) => void }).mockResolvedValue('$2a$10$hashed');

      const result = await hashPassword('plain');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(result).toBe('$2a$10$hashed');
    });
  });

  describe('verifyPassword', () => {
    it('returns true when bcrypt.compare resolves true', async () => {
      (vi.mocked(bcrypt.compare) as unknown as { mockResolvedValue: (v: boolean) => void }).mockResolvedValue(true);

      const result = await verifyPassword('plain', '$2a$10$hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', '$2a$10$hash');
      expect(result).toBe(true);
    });

    it('returns false when bcrypt.compare resolves false', async () => {
      (vi.mocked(bcrypt.compare) as unknown as { mockResolvedValue: (v: boolean) => void }).mockResolvedValue(false);

      const result = await verifyPassword('wrong', '$2a$10$hash');

      expect(result).toBe(false);
    });
  });
});
