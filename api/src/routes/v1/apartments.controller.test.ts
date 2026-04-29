import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import * as ctrl from './apartments.controller.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../test/controllerHelper.js';

// Mock services
vi.mock('../../services/apartment.service.js', () => ({
  defaultApartmentService: {
    listByOrg: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    validateOwnership: vi.fn(),
  },
}));

vi.mock('../../services/room.service.js', () => ({
  defaultRoomService: {
    listByApartment: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    batchCreate: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    validateOwnership: vi.fn(),
  },
}));

vi.mock('../../services/utilityConfig.service.js', () => ({
  defaultUtilityConfigService: {
    getByApartmentId: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../repositories/apartment.repo.js', () => ({
  defaultApartmentRepo: {
    findById: vi.fn(),
    countByOrgId: vi.fn(),
  },
}));

vi.mock('../../utils/orgContext.js', () => ({
  requireOrgMembership: vi.fn().mockResolvedValue('org-1'),
  requirePermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/orgPlanLimits.js', () => ({
  getEffectivePlanLimits: vi.fn().mockResolvedValue({
    max_apartments: 10,
    max_rooms: 100,
  }),
  getRoomsUsedForLimitCheck: vi.fn().mockResolvedValue(0),
}));

vi.mock('../../utils/context.js', () => ({
  getConsoleUser: vi.fn().mockReturnValue({ id: 'user-1' } as any),
}));

import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultRoomService } from '../../services/room.service.js';
import { defaultUtilityConfigService } from '../../services/utilityConfig.service.js';
import { defaultApartmentRepo } from '../../repositories/apartment.repo.js';

describe('ApartmentsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return list of apartments', async () => {
      const mockList = [{ id: 'apt-1', name: 'Apartment 1' }];
      vi.mocked(defaultApartmentService.listByOrg).mockResolvedValue(mockList as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.list(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockList);
    });
  });

  describe('create', () => {
    it('should create apartment successfully', async () => {
      const mockApt = { id: 'apt-new', name: 'New Apartment' };
      vi.mocked(defaultApartmentRepo.countByOrgId).mockResolvedValue(0);
      vi.mocked(defaultApartmentService.create).mockResolvedValue(mockApt as any);

      const req = createMockRequest({ body: { name: 'New Apartment', address: '测试地址' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockApt);
    });

    it('should return 403 when max apartments reached', async () => {
      vi.mocked(defaultApartmentRepo.countByOrgId).mockResolvedValue(10);

      const req = createMockRequest({ body: { name: 'New Apartment' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(403);
    });

    it('should return 422 when validation fails', async () => {
      // Set up mocks for this specific test
      vi.mocked(defaultApartmentRepo.countByOrgId).mockResolvedValue(0);

      const req = createMockRequest({ body: { name: '' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('update', () => {
    it('should update apartment successfully', async () => {
      const mockApt = { id: 'apt-1', name: 'Updated' };
      vi.mocked(defaultApartmentService.update).mockResolvedValue(mockApt as any);

      const req = createMockRequest({
        params: { id: 'apt-1' },
        body: { name: 'Updated' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.update(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockApt);
    });
  });

  describe('listRooms', () => {
    it('should return rooms for apartment', async () => {
      const mockRooms = [{ id: 'room-1', room_number: '101' }];
      vi.mocked(defaultRoomService.listByApartment).mockResolvedValue(mockRooms as any);

      const req = createMockRequest({ params: { apartmentId: 'apt-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listRooms(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockRooms);
    });
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      const mockRoom = { id: 'room-new', room_number: '102' };
      vi.mocked(defaultRoomService.create).mockResolvedValue(mockRoom as any);

      const req = createMockRequest({
        params: { apartmentId: 'apt-1' },
        body: { room_number: '102', monthly_rent: 2000 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.createRoom(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockRoom);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({
        params: { apartmentId: 'apt-1' },
        body: { monthly_rent: 2000 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.createRoom(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('batchCreateRooms', () => {
    it('should batch create rooms successfully', async () => {
      const mockRooms = [{ id: 'room-1' }, { id: 'room-2' }];
      vi.mocked(defaultRoomService.batchCreate).mockResolvedValue(mockRooms as any);

      const req = createMockRequest({
        params: { apartmentId: 'apt-1' },
        body: { room_numbers: ['101', '102'], monthly_rent: 2000 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.batchCreateRooms(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockRooms);
    });
  });

  describe('getUtilityConfig', () => {
    it('should return utility config', async () => {
      const mockConfig = { id: 'config-1', water_price_per_unit: 5.0 };
      vi.mocked(defaultUtilityConfigService.getByApartmentId).mockResolvedValue(mockConfig as any);

      const req = createMockRequest({ params: { apartmentId: 'apt-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getUtilityConfig(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('updateUtilityConfig', () => {
    it('should update utility config successfully', async () => {
      const mockConfig = { id: 'config-1', water_price_per_unit: 6.0 };
      vi.mocked(defaultUtilityConfigService.update).mockResolvedValue(mockConfig as any);

      const req = createMockRequest({
        params: { apartmentId: 'apt-1' },
        body: { water_price_per_unit: 6.0 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.updateUtilityConfig(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockConfig);
    });
  });
});
