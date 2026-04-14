'use client';

import { UseFormReturn } from 'react-hook-form';
import { Building2, DoorOpen, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseSigningFormData } from '../leases.schemas';
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
          <h3 className="text-base font-semibold text-foreground">选择签约房间</h3>
          <p className="text-sm text-muted-foreground">确认公寓和房间信息</p>
        </div>
      </div>

      {/* Room Info Card - when room is pre-specified */}
      {isRoomSpecified && room ? (
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-amber-100">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{room.apartment?.name || '未知公寓'}</p>
                <p className="text-sm text-muted-foreground">房间号 {room.room_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">已选择</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-amber-200/50" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/80 px-4 py-3 text-center shadow-sm border border-amber-100/50">
              <p className="text-xs text-muted-foreground mb-1">月租</p>
              <p className="text-lg font-bold text-foreground">¥{room.monthly_rent}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-4 py-3 text-center shadow-sm border border-amber-100/50">
              <p className="text-xs text-muted-foreground mb-1">面积</p>
              <p className="text-lg font-bold text-foreground">{room.area || '—'}㎡</p>
            </div>
          </div>
        </div>
      ) : (
        /* Apartment + Room selection */
        <div className="space-y-4">
          {/* Apartment selector */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Building2 className="h-4 w-4 text-amber-600" />
              选择公寓
            </label>
            <Select value={selectedApartmentId || ''} onValueChange={onApartmentChange}>
              <SelectTrigger className="h-11 rounded-xl border-input bg-background shadow-sm">
                <SelectValue placeholder="请选择公寓" />
              </SelectTrigger>
              <SelectContent>
                {apartments?.map((apt: Apartment) => (
                  <SelectItem key={apt.id} value={apt.id} className="rounded-lg">
                    {apt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room selector */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <DoorOpen className="h-4 w-4 text-amber-600" />
              选择房间
            </label>
            <Select
              value={form.watch('room_id') || ''}
              onValueChange={(v) => form.setValue('room_id', v)}
            >
              <SelectTrigger className="h-11 rounded-xl border-input bg-background shadow-sm">
                <SelectValue placeholder="请选择空置房间" />
              </SelectTrigger>
              <SelectContent>
                {rooms
                  ?.filter((r: Room) => r.status === 'available')
                  .map((r: Room) => (
                    <SelectItem key={r.id} value={r.id} className="rounded-lg">
                      <span className="font-medium">{r.room_number}</span>
                      <span className="ml-2 text-muted-foreground">¥{r.monthly_rent}/月</span>
                      {r.area && <span className="ml-2 text-muted-foreground text-xs">{r.area}㎡</span>}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors.room_id && (
              <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {form.formState.errors.room_id.message}
              </p>
            )}
          </div>

          {/* Selected room preview */}
          {selectedRoom && (
            <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedRoom.apartment?.name} — {selectedRoom.room_number}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedRoom.layout && `户型 ${selectedRoom.layout}`}
                    {selectedRoom.area && ` · ${selectedRoom.area}㎡`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-600">¥{selectedRoom.monthly_rent}</p>
                  <p className="text-xs text-muted-foreground">月租</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
