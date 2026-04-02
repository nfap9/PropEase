'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { changeRoomSchema, type ChangeRoomFormData } from '../../schemas/lease-operations.schemas';
import { useChangeRoom } from '../../hooks/use-lease-operations';
import { roomsApi, apartmentsApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';
import { AppDrawer } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';

interface ChangeRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function ChangeRoomSheet({ open, onOpenChange, orgId, leaseId }: ChangeRoomSheetProps) {
  const form = useForm<ChangeRoomFormData>({
    resolver: zodResolver(changeRoomSchema),
    defaultValues: { newRoomId: '', changeDate: '', reason: '' },
  });

  const changeRoom = useChangeRoom(orgId, leaseId);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: open,
  });

  const { data: rooms } = useQuery({
    queryKey: ['all-rooms', orgId, apartments?.map((a) => a.id)],
    queryFn: () => roomsApi.listAll(orgId, apartments?.map((a) => a.id) || []),
    enabled: open && !!apartments,
  });

  const availableRooms = rooms?.filter((r) => r.status === 'available') || [];

  const onSubmit = (data: ChangeRoomFormData) => {
    changeRoom.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="换房"
      description="将租约切换到其他房间"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" disabled={changeRoom.isPending}>
            {changeRoom.isPending ? '提交中...' : '确认换房'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newRoomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>目标房间 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标房间" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.apartment?.name} - {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="changeDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>变更日期 *</FormLabel>
                <FormControl>
                  <DateTimePicker
                    mode="date"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="选择变更日期"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>原因备注</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="可选" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </AppDrawer>
  );
}
