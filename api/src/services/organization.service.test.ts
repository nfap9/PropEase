import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrganizationService } from './organization.service.js';
import type { OrganizationRepository } from '../repositories/organization.repo.js';

describe('OrganizationService', () => {
  const repo: OrganizationRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findPersonalOrgByUserId: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMember: vi.fn(),
    findMemberWithRole: vi.fn(),
    findMembersByOrgId: vi.fn(),
    createMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should sort organizations with personal first then by name naturally', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([
      {
        id: 'org-z',
        name: '组织10',
        slug: 'org-10',
        is_personal: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        members: [{ user_id: 'user-1', role: 'member' }] as any,
      },
      {
        id: 'org-personal',
        name: '我的空间',
        slug: 'personal',
        is_personal: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        members: [{ user_id: 'user-1', role: 'owner' }] as any,
      },
      {
        id: 'org-a',
        name: '组织2',
        slug: 'org-2',
        is_personal: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        members: [{ user_id: 'user-1', role: 'admin' }] as any,
      },
    ] as any);

    const service = createOrganizationService(() => repo);
    const result = await service.listByUser('user-1');

    expect(result.map((item) => item.id)).toEqual(['org-personal', 'org-a', 'org-z']);
  });
});
