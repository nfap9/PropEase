
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { changeRoomSchema, type ChangeRoomFormData } from '@/schemas/lease-operations';
import { useChangeRoom } from '@/hooks/use-lease-operations';
import { roomsApi, apartmentsApi } from '@/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@apartment-ultra/shared-ui/components/ui';
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>换房</SheetTitle>
          <SheetDescription>将租约切换到其他房间</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newRoomId">目标房间 *</Label>
            <Controller
              name="newRoomId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择目标房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.apartment?.name} - {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.newRoomId && (
              <p className="text-sm text-destructive">{form.formState.errors.newRoomId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="changeDate">变更日期 *</Label>
            <Controller
              name="changeDate"
              control={form.control}
              render={({ field }) => (
                <DateTimePicker
                  mode="date"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="选择变更日期"
                />
              )}
            />
            {form.formState.errors.changeDate && (
              <p className="text-sm text-destructive">{form.formState.errors.changeDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">原因备注</Label>
            <Controller
              name="reason"
              control={form.control}
              render={({ field }) => <Input {...field} placeholder="可选" />}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          </form>
          </FormProvider>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={changeRoom.isPending}>
              {changeRoom.isPending ? '提交中...' : '确认换房'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
