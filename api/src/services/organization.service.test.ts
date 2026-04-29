import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrganizationService } from './organization.service.js';
import type { OrganizationRepository } from '../repositories/organization.repo.js';
import type { OrgRole } from '@prisma/client';

describe('OrganizationService', () => {
  const mockRole: OrgRole = {
    id: 'role-1',
    organization_id: 'org-1',
    name: '管理员',
    description: null,
    is_system: true,
    permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

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
    const orgs = [
      {
        id: 'org-z',
        name: '组织10',
        slug: 'org-10',
        is_personal: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'org-personal',
        name: '我的空间',
        slug: 'personal',
        is_personal: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'org-a',
        name: '组织2',
        slug: 'org-2',
        is_personal: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    vi.mocked(repo.findByUserId).mockResolvedValue(orgs as any);
    vi.mocked(repo.findMemberWithRole).mockResolvedValue({
      id: 'member-1',
      user_id: 'user-1',
      organization_id: 'org-1',
      role_id: 'role-1',
      created_at: new Date(),
      updated_at: new Date(),
      role: mockRole,
    } as any);

    const service = createOrganizationService(() => repo);
    const result = await service.listByUser('user-1');

    // personal org first, then by name naturally (组织2 < 组织10)
    expect(result.map((item) => item.org.id)).toEqual(['org-personal', 'org-a', 'org-z']);
  });
});
