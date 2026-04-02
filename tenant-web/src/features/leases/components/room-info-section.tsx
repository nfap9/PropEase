'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
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
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">房间信息</h3>
      {isRoomSpecified ? (
        <div className="space-y-2">
          <Label>房间</Label>
          <Input
            value={room ? `${room.apartment?.name || ''} - ${room.room_number}` : ''}
            disabled
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>选择公寓</Label>
            <Select value={selectedApartmentId || ''} onValueChange={onApartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择公寓" />
              </SelectTrigger>
              <SelectContent>
                {apartments?.map((apt: Apartment) => (
                  <SelectItem key={apt.id} value={apt.id}>
                    {apt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label required>
              选择房间
            </Label>
            <Select
              value={form.watch('room_id') || ''}
              onValueChange={(v) => form.setValue('room_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择房间" />
              </SelectTrigger>
              <SelectContent>
                {rooms
                  ?.filter((r: Room) => r.status === 'available')
                  .map((r: Room) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} - ¥{r.monthly_rent}/月
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors.room_id && (
              <p className="text-sm text-destructive">{form.formState.errors.room_id.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
