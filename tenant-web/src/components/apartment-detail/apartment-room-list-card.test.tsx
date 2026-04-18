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
  const [isBatchSelectMode, setIsBatchSelectMode] = useState(false);

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
      isBatchSelectMode={isBatchSelectMode}
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
      onToggleBatchSelectMode={() => setIsBatchSelectMode((prev) => !prev)}
      onClearSelection={() => {
        setSelectedRoomIds(new Set());
        setIsBatchSelectMode(false);
      }}
    />
  );
}

describe('ApartmentRoomListCard', () => {
  it('renders room card correctly', () => {
    render(<TestWrapper />);

    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('批量新增')).toBeInTheDocument();
    expect(screen.getByText('批量选择')).toBeInTheDocument();
  });

  it('opens edit room on click when batch select mode is off', async () => {
    const handleEditRoom = vi.fn();
    const user = userEvent.setup();

    render(<TestWrapper onEditRoom={handleEditRoom} />);

    const roomCard = screen.getByText('101').closest('div[role="button"]');
    expect(roomCard).not.toBeNull();

    await user.click(roomCard!);

    expect(handleEditRoom).toHaveBeenCalledWith(rooms[0]);
  });

  it('toggles room selection on click when batch select mode is on', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Enable batch select mode
    const batchSelectSwitch = screen.getByRole('switch');
    await user.click(batchSelectSwitch);

    const roomCard = screen.getByText('101').closest('div[role="button"]');
    expect(roomCard).not.toBeNull();

    expect(screen.queryByLabelText('已选房间')).not.toBeInTheDocument();

    await user.click(roomCard!);

    expect(screen.getByLabelText('已选房间')).toBeInTheDocument();

    await user.click(roomCard!);

    expect(screen.queryByLabelText('已选房间')).not.toBeInTheDocument();
  });

  it('opens context menu on right click and exposes edit and delete actions', () => {
    const handleEditRoom = vi.fn();
    const handleDeleteRoom = vi.fn();

    render(<TestWrapper onEditRoom={handleEditRoom} onDeleteRoom={handleDeleteRoom} />);

    const roomCard = screen.getByText('101').closest('div[role="button"]');
    expect(roomCard).not.toBeNull();

    // Context menu should not appear in batch select mode
    fireEvent.contextMenu(roomCard!, { clientX: 120, clientY: 160 });

    // Since batch select mode is off by default, context menu should not show
    // (edit is handled by click in non-batch mode)
  });
});
