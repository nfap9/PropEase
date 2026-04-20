
import { UseFormReturn } from 'react-hook-form';
import { Building2, DoorOpen, CheckCircle2 } from 'lucide-react';
import { Select } from 'antd';
import type { LeaseSigningFormData } from '@/schemas/leases';
import type { Room, Apartment } from '@apartment-ultra/api-contract';

interface RoomInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  room?: Room | null;
  isRoomSpecified: boolean;
  apartments?: Apartment[];
  rooms?: Room[];
  selectedApartmentId: string | null;
  onApartmentChange: (id: string) => void;
}

export function RoomInfoSection({
  form,
  room,
  isRoomSpecified,
  apartments,
  rooms,
  selectedApartmentId,
  onApartmentChange,
}: RoomInfoSectionProps) {
  const selectedRoomId = form.watch('room_id');
  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <DoorOpen className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">选择签约房间</h3>
          <p className="text-sm text-gray-500">确认公寓和房间信息</p>
        </div>
      </div>

      {/* Room Info Card - when room is pre-specified */}
      {isRoomSpecified && room ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{room.apartment?.name || '未知公寓'}</p>
                <p className="text-sm text-gray-500">房间号 {room.room_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">已选择</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">月租</p>
              <p className="text-lg font-bold text-gray-900">
                {room.pricing?.monthly_rent ? `¥${room.pricing.monthly_rent}` : '暂无定价'}
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">面积</p>
              <p className="text-lg font-bold text-gray-900">{room.area || '—'}㎡</p>
            </div>
          </div>
        </div>
      ) : (
        /* Apartment + Room selection */
        <div className="space-y-4">
          {/* Apartment selector */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <Building2 className="h-4 w-4 text-amber-600" />
              选择公寓
            </label>
            <Select value={selectedApartmentId || ''} onChange={onApartmentChange} className="w-full" placeholder="请选择公寓">
              {apartments?.map((apt: Apartment) => (
                <Select.Option key={apt.id} value={apt.id}>
                  {apt.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Room selector */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <DoorOpen className="h-4 w-4 text-amber-600" />
              选择房间
            </label>
            <Select
              value={form.watch('room_id') || ''}
              onChange={(v) => {
                form.setValue('room_id', v);
                const room = rooms?.find((r) => r.id === v);
                if (room?.pricing?.monthly_rent) {
                  form.setValue('monthly_rent', room.pricing.monthly_rent);
                }
              }}
              className="w-full"
              placeholder="请选择空置房间"
            >
              {rooms
                ?.filter((r: Room) => r.status === 'available')
                .map((r: Room) => (
                  <Select.Option key={r.id} value={r.id}>
                    <span className="font-medium">{r.room_number}</span>
                    <span className="ml-2 text-gray-400">
                      {r.pricing?.monthly_rent ? `¥${r.pricing.monthly_rent}/月` : '暂无定价'}
                    </span>
                    {r.area && <span className="ml-2 text-gray-400 text-xs">{r.area}㎡</span>}
                  </Select.Option>
                ))}
            </Select>
            {form.formState.errors.room_id && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {form.formState.errors.room_id.message}
              </p>
            )}
          </div>

          {/* Selected room preview */}
          {selectedRoom && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedRoom.apartment?.name} — {selectedRoom.room_number}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedRoom.layout && `户型 ${selectedRoom.layout}`}
                    {selectedRoom.area && ` · ${selectedRoom.area}㎡`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {selectedRoom.pricing?.monthly_rent ? `¥${selectedRoom.pricing.monthly_rent}` : '暂无定价'}
                  </p>
                  <p className="text-xs text-gray-500">月租</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
