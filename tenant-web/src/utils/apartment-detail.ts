import type { Apartment, Room, RoomFacilities } from '@/types';
import { getFacilityLabel } from '@/constants/facilities';

export interface GeneratedFloorRooms {
  floor: number;
  rooms: string[];
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

export interface FloorRoomGroup {
  floor: number;
  rooms: Room[];
}

export const extractFloor = (roomNumber: string): number => {
  if (roomNumber.length <= 2) return 1;
  return parseInt(roomNumber.slice(0, -2), 10) || 1;
};

export const parseFloors = (floorsStr: string): number[] => {
  const floors = new Set<number>();
  const parts = floorsStr.split(',').map((segment) => segment.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((segment) => parseInt(segment.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let floor = start; floor <= end; floor += 1) {
          floors.add(floor);
        }
      }
      continue;
    }

    const floor = parseInt(part, 10);
    if (!isNaN(floor)) {
      floors.add(floor);
    }
  }

  return Array.from(floors).sort((left, right) => left - right);
};

export const parseRoomNumbers = (roomNumbersStr: string): number[] => {
  const roomNumbers = new Set<number>();
  const parts = roomNumbersStr.split(',').map((segment) => segment.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((segment) => parseInt(segment.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let num = start; num <= end; num += 1) {
          roomNumbers.add(num);
        }
      }
      continue;
    }

    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      roomNumbers.add(num);
    }
  }

  return Array.from(roomNumbers).sort((left, right) => left - right);
};

export const buildGeneratedRoomGroups = (
  floorsValue: string,
  roomNumbersStr: string
): GeneratedFloorRooms[] => {
  const floors = parseFloors(floorsValue || '1');
  const roomNumbers = parseRoomNumbers(roomNumbersStr || '1-10');

  return floors.map((floor) => ({
    floor,
    rooms: roomNumbers.map((num) => `${floor}${String(num).padStart(2, '0')}`),
  }));
};

export const buildApartmentFormValues = (apartment: Apartment) => ({
  name: apartment.name,
  address: apartment.address ?? '',
  description: apartment.description ?? '',
  floors: apartment.floors ?? undefined,
  land_area: apartment.land_area ?? undefined,
  total_area: apartment.total_area ?? undefined,
  landlord_name: apartment.landlord_name ?? '',
  landlord_contact: apartment.landlord_contact ?? '',
  contract_start: apartment.contract_start
    ? new Date(apartment.contract_start).toISOString().split('T')[0]
    : '',
  contract_end: apartment.contract_end
    ? new Date(apartment.contract_end).toISOString().split('T')[0]
    : '',
  landlord_rent: apartment.landlord_rent ?? undefined,
  operating_cost: apartment.operating_cost ?? undefined,
});

export const getRoomStats = (rooms: Room[] | undefined): RoomStats => ({
  total: rooms?.length ?? 0,
  available: rooms?.filter((room) => room.status === 'available').length ?? 0,
  occupied: rooms?.filter((room) => room.status === 'occupied').length ?? 0,
  maintenance: rooms?.filter((room) => room.status === 'maintenance').length ?? 0,
});

export const groupRoomsByFloor = (rooms: Room[] | undefined): FloorRoomGroup[] => {
  if (!rooms || rooms.length === 0) {
    return [];
  }

  const grouped = new Map<number, Room[]>();
  for (const room of rooms) {
    const floor = extractFloor(room.room_number);
    const floorRooms = grouped.get(floor) ?? [];
    floorRooms.push(room);
    grouped.set(floor, floorRooms);
  }

  return Array.from(grouped.entries())
    .sort(([leftFloor], [rightFloor]) => leftFloor - rightFloor)
    .map(([floor, floorRooms]) => ({
      floor,
      rooms: floorRooms.sort((left, right) => left.room_number.localeCompare(right.room_number)),
    }));
};

export const getFacilitiesSummary = (facilities: RoomFacilities | null | undefined): string => {
  if (!facilities || (facilities.furniture.length === 0 && facilities.appliances.length === 0)) {
    return '未配置';
  }

  const allItems = [...facilities.furniture, ...facilities.appliances];
  const count = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const names = allItems.slice(0, 4).map((item) => {
    const label = getFacilityLabel(item.code);
    return item.quantity > 1 ? `${label}×${item.quantity}` : label;
  });
  const remaining = allItems.length - 4;

  return remaining > 0 ? `${names.join('、')} 等${count}件` : `${names.join('、')} 共${count}件`;
};

