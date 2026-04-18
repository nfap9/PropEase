import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Room } from '@/types';
import { ApartmentRoomListCard } from './apartment-room-list-card';

const rooms: Room[] = [
  {
    id: 'room-1',
    apartment_id: 'apartment-1',
    room_number: '101',
    layout: '一室一厅',
    area: 32,
    status: 'available',
    notes: null,
    facilities: null,
    pricing: { id: 'pricing-1', room_id: 'room-1', monthly_rent: 2200, effective_date: '2026-03-28T00:00:00.000Z' },
    created_at: '2026-03-28T00:00:00.000Z',
  },
];

function TestWrapper({
  onEditRoom = () => {},
  onDeleteRoom = () => {},
}: {
  onEditRoom?: (room: Room) => void;
  onDeleteRoom?: (room: Room) => void;
}) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());

  return (
    <ApartmentRoomListCard
      roomsLoading={false}
      rooms={rooms}
      roomGroups={[
        {
          floor: 1,
          rooms,
        },
      ]}
      selectedRoomIds={selectedRoomIds}
      isBatchDeletePending={false}
      onOpenCreateRoom={() => {}}
      onOpenBatchCreate={() => {}}
      onOpenBatchEdit={() => {}}
      onDeleteSelected={() => {}}
      onSelectAllRooms={(select) => setSelectedRoomIds(select ? new Set(['room-1']) : new Set())}
      onToggleFloorSelection={(floorRooms, select) =>
        setSelectedRoomIds(select ? new Set(floorRooms.map((room) => room.id)) : new Set())
      }
      onToggleRoomSelection={(roomId) =>
        setSelectedRoomIds((prev) => {
          const next = new Set(prev);
          if (next.has(roomId)) {
            next.delete(roomId);
          } else {
            next.add(roomId);
          }
          return next;
        })
      }
      onEditRoom={onEditRoom}
      onDeleteRoom={onDeleteRoom}
    />
  );
}

describe('ApartmentRoomListCard', () => {
  it('disables edit and delete buttons when no room is selected', () => {
    render(<TestWrapper />);

    expect(screen.getByRole('button', { name: '全选' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消全选' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '删除' })).toBeDisabled();
  });

  it('toggles room selection on click and shows selected icon only when selected', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    const roomCard = screen.getByText('101').closest('div[role="button"]');
    expect(roomCard).not.toBeNull();

    expect(screen.queryByLabelText('已选房间')).not.toBeInTheDocument();

    await user.click(roomCard!);

    expect(screen.getByRole('button', { name: '取消全选' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑 (1)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '删除 (1)' })).toBeEnabled();
    expect(screen.getByLabelText('已选房间')).toBeInTheDocument();
    expect(screen.getByLabelText('已选房间')).toHaveClass('-left-2', '-top-2', 'z-10');

    await user.click(roomCard!);

    expect(screen.queryByLabelText('已选房间')).not.toBeInTheDocument();
  });

  it('opens context menu on right click and exposes edit and delete actions', () => {
    const handleEditRoom = vi.fn();
    const handleDeleteRoom = vi.fn();

    render(<TestWrapper onEditRoom={handleEditRoom} onDeleteRoom={handleDeleteRoom} />);

    const roomCard = screen.getByText('101').closest('div[role="button"]');
    expect(roomCard).not.toBeNull();

    expect(screen.getAllByRole('button', { name: '编辑' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '删除' })).toHaveLength(1);

    fireEvent.contextMenu(roomCard!, { clientX: 120, clientY: 160 });

    expect(screen.getAllByRole('button', { name: '编辑' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '删除' })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: '编辑' })[1]);
    expect(handleEditRoom).toHaveBeenCalledWith(rooms[0]);
  });
});
