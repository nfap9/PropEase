import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServiceProduct } from '@prisma/client';
import { createPersonalOrg, createPersonalOrgWithFreePlan } from './createPersonalOrgWithFreePlan.js';
import type { OrganizationRepository } from '../repositories/organization.repo.js';
import type { SubscriptionRepository } from '../repositories/subscription.repo.js';

const sampleFreeService: ServiceProduct = {
  id: 'service-free',
  code: 'free',
  name: '免费版',
  description: '免费计划',
  max_organizations: 1,
  max_apartments: 1,
  max_rooms: 10,
  max_members: 3,
  is_active: true,
  sort_order: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('createPersonalOrg helpers', () => {
  const txDb = { name: 'tx-db' };
  let baseOrgRepo: OrganizationRepository;
  let txOrgRepo: OrganizationRepository;
  let baseSubscriptionRepo: SubscriptionRepository;
  let txSubscriptionRepo: SubscriptionRepository;
  let getOrgRepo: (db: unknown) => OrganizationRepository;
  let getSubscriptionRepo: (db: unknown) => SubscriptionRepository;
  let runInTransaction: <T>(callback: (db: unknown) => Promise<T>) => Promise<T>;

  beforeEach(() => {
    baseOrgRepo = {
      findBySlug: vi.fn(),
    } as unknown as OrganizationRepository;
    txOrgRepo = {
      create: vi.fn(),
      createMember: vi.fn(),
    } as unknown as OrganizationRepository;

    baseSubscriptionRepo = {
      findActiveServiceByCode: vi.fn(),
    } as unknown as SubscriptionRepository;
    txSubscriptionRepo = {
      createSubscription: vi.fn(),
    } as unknown as SubscriptionRepository;

    getOrgRepo = vi.fn((db: unknown) => (db === txDb ? txOrgRepo : baseOrgRepo));
    getSubscriptionRepo = vi.fn((db: unknown) =>
      db === txDb ? txSubscriptionRepo : baseSubscriptionRepo
    );
    runInTransaction = async <T>(callback: (db: unknown) => Promise<T>) => callback(txDb);
  });

  it('createPersonalOrg should do nothing when personal org already exists', async () => {
    vi.mocked(baseOrgRepo.findBySlug).mockResolvedValue({
      id: 'org-existing',
    } as never);

    await createPersonalOrg('user-1', {
      getOrgRepo: getOrgRepo as never,
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(baseOrgRepo.findBySlug).toHaveBeenCalledWith('personal-user-1');
    expect(getSubscriptionRepo).not.toHaveBeenCalled();
    expect(txOrgRepo.create).not.toHaveBeenCalled();
  });

  it('createPersonalOrg should create org and owner membership through repositories', async () => {
    vi.mocked(baseOrgRepo.findBySlug).mockResolvedValue(null);
    const createId = vi.fn().mockReturnValueOnce('org-1').mockReturnValueOnce('member-1');

    await createPersonalOrg('user-1', {
      createId,
      getOrgRepo: getOrgRepo as never,
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txOrgRepo.create).toHaveBeenCalledWith({
      id: 'org-1',
      name: '个人',
      slug: 'personal-user-1',
      is_personal: true,
    });
    expect(txOrgRepo.createMember).toHaveBeenCalledWith({
      id: 'member-1',
      organization: { connect: { id: 'org-1' } },
      user: { connect: { id: 'user-1' } },
      role: 'owner',
    });
  });

  it('createPersonalOrgWithFreePlan should create org, member and subscription when free service exists', async () => {
    vi.mocked(baseOrgRepo.findBySlug).mockResolvedValue(null);
    vi.mocked(baseSubscriptionRepo.findActiveServiceByCode).mockResolvedValue(sampleFreeService);
    const createId = vi
      .fn()
      .mockReturnValueOnce('org-1')
      .mockReturnValueOnce('member-1')
      .mockReturnValueOnce('sub-1');

    await createPersonalOrgWithFreePlan('user-1', {
      createId,
      getOrgRepo: getOrgRepo as never,
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(baseSubscriptionRepo.findActiveServiceByCode).toHaveBeenCalledWith('free');
    expect(txOrgRepo.create).toHaveBeenCalled();
    expect(txOrgRepo.createMember).toHaveBeenCalled();
    expect(txSubscriptionRepo.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sub-1',
        organization: { connect: { id: 'org-1' } },
        service: { connect: { id: sampleFreeService.id } },
        status: 'active',
        auto_renew: false,
      })
    );
  });

  it('createPersonalOrgWithFreePlan should fallback to org creation when no free service exists', async () => {
    vi.mocked(baseOrgRepo.findBySlug).mockResolvedValue(null);
    vi.mocked(baseSubscriptionRepo.findActiveServiceByCode).mockResolvedValue(null);
    const createId = vi.fn().mockReturnValueOnce('org-1').mockReturnValueOnce('member-1');

    await createPersonalOrgWithFreePlan('user-1', {
      createId,
      getOrgRepo: getOrgRepo as never,
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txOrgRepo.create).toHaveBeenCalled();
    expect(txOrgRepo.createMember).toHaveBeenCalled();
    expect(txSubscriptionRepo.createSubscription).not.toHaveBeenCalled();
  });
});
