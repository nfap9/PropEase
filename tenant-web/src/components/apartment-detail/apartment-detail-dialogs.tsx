
import { Check, Loader2, Settings2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { ApartmentForm } from '@/components/apartments';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { EditRoomDialog } from '@/components/rooms/EditRoomDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Switch } from '@apartment-ultra/shared-ui/components/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { Room, RoomFacilities, RoomStatus } from '@/types';
import {
  type ApartmentFormData,
  type BatchEditFormData,
  type RoomBatchConfigData,
  type RoomFormData,
  LAYOUT_OPTIONS,
} from '@/schemas/apartment-detail';
import type { GeneratedFloorRooms } from '@/utils/apartment-detail';
import { getFacilitiesSummary } from '@/utils/apartment-detail';

export function ApartmentEditDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ApartmentFormData>;
  onSubmit: (data: ApartmentFormData) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑公寓</DialogTitle>
          <DialogDescription>修改公寓信息</DialogDescription>
        </DialogHeader>
        <ApartmentForm form={form} mode="edit" onSubmit={onSubmit} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateRoomDialog({
  apartmentName,
  open,
  onOpenChange,
  form,
  facilities,
  onFacilitiesChange,
  facilityDialogOpen,
  onFacilityDialogOpenChange,
  onSubmit,
  isPending,
}: {
  apartmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RoomFormData>;
  facilities: RoomFacilities | null;
  onFacilitiesChange: (value: RoomFacilities | null) => void;
  facilityDialogOpen: boolean;
  onFacilityDialogOpenChange: (open: boolean) => void;
  onSubmit: (data: RoomFormData) => void;
  isPending: boolean;
}) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增房间</DialogTitle>
            <DialogDescription>在 {apartmentName} 添加新房间</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="房间号" htmlFor="room_number" required error={form.formState.errors.room_number?.message}>
                <Input id="room_number" placeholder="请输入房间号" {...form.register('room_number')} />
              </FormField>
              <div className="space-y-2">
                <Label htmlFor="layout">户型</Label>
                <Select value={form.watch('layout') || ''} onValueChange={(value) => form.setValue('layout', value)}>
                  <SelectTrigger className="min-w-[120px]">
                    <SelectValue placeholder="选择户型" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((layout) => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="面积 (m²)" htmlFor="area">
                <Input id="area" type="number" step="0.01" placeholder="请输入面积" {...form.register('area', { valueAsNumber: true })} />
              </FormField>
            </div>

            <FormField label="备注" htmlFor="notes">
              <Input id="notes" placeholder="请输入备注" {...form.register('notes')} />
            </FormField>

            <div className="space-y-2">
              <Label>家具家电</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => onFacilityDialogOpenChange(true)}
              >
                <span className="text-muted-foreground">{getFacilitiesSummary(facilities)}</span>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FacilitySelectorDialog
        value={facilities}
        onChange={onFacilitiesChange}
        open={facilityDialogOpen}
        onOpenChange={onFacilityDialogOpenChange}
      />
    </>
  );
}

export function BatchCreateRoomDialog({
  open,
  onOpenChange,
  form,
  generatedRooms,
  selectedRooms,
  onToggleAll,
  onToggleFloor,
  onToggleRoom,
  onSubmitRooms,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RoomBatchConfigData>;
  generatedRooms: GeneratedFloorRooms[];
  selectedRooms: Set<string>;
  onToggleAll: (select: boolean) => void;
  onToggleFloor: (roomNumbers: string[], select: boolean) => void;
  onToggleRoom: (roomNumber: string) => void;
  onSubmitRooms: () => void;
  isPending: boolean;
}) {
  const totalGeneratedRooms = generatedRooms.reduce((sum, floorGroup) => sum + floorGroup.rooms.length, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>批量添加房间</SheetTitle>
          <SheetDescription>设置楼层和房间号范围，点击房间号切换启用状态</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floors" required>
                楼层
              </Label>
              <Input id="floors" placeholder="如 1,2,3 或 1-5" {...form.register('floors')} />
              <p className="text-sm text-muted-foreground">支持多楼层（如 1,2,3 或 1-5）</p>
              {form.formState.errors.floors?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.floors.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_numbers" required>
                房间号
              </Label>
              <Input id="room_numbers" placeholder="如 1,2,3 或 1-5" {...form.register('room_numbers')} />
              <p className="text-sm text-muted-foreground">支持多房间号（如 1,2,3 或 1-5）</p>
              {form.formState.errors.room_numbers?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.room_numbers.message}</p>
              )}
            </div>
          </div>
        </form>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onToggleAll(true)}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={() => onToggleAll(false)}>
            取消全选
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          将生成 {totalGeneratedRooms} 个房间，点击房间号启用/禁用
        </div>

        <div className="max-h-[400px] space-y-4 overflow-y-auto">
          {generatedRooms.map(({ floor, rooms }) => {
            const selectedCount = rooms.filter((roomNumber) => selectedRooms.has(roomNumber)).length;
            const allSelected = selectedCount === rooms.length;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <div key={floor} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={allSelected ? 'default' : 'outline'}
                      size="sm"
                      className="h-7"
                      onClick={() => onToggleFloor(rooms, !allSelected)}
                    >
                      {allSelected ? (
                        <Check className="mr-1 h-4 w-4" />
                      ) : someSelected ? (
                        <span className="mr-1 flex h-4 w-4 items-center justify-center text-xs">-</span>
                      ) : (
                        <span className="mr-1 h-4 w-4" />
                      )}
                      {floor}楼
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      ({selectedCount}/{rooms.length})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onToggleFloor(rooms, !allSelected)}
                  >
                    {allSelected ? '取消整层' : '选择整层'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((roomNumber) => {
                    const isSelected = selectedRooms.has(roomNumber);
                    return (
                      <button
                        key={roomNumber}
                        type="button"
                        onClick={() => onToggleRoom(roomNumber)}
                        className={`rounded-md px-3 py-1.5 font-mono text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {roomNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-muted-foreground">
              已选择 <span className="font-medium text-foreground">{selectedRooms.size}</span> 个房间
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                type="button"
                onClick={onSubmitRooms}
                disabled={selectedRooms.size === 0 || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>确认添加 ({selectedRooms.size})</>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除房间 "{room?.room_number ?? ''}" 吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              '删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BatchEditDialog({
  open,
  onOpenChange,
  form,
  selectedCount,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<BatchEditFormData>;
  selectedCount: number;
  onSubmit: (data: BatchEditFormData) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>批量编辑</DialogTitle>
          <DialogDescription>为选中的 {selectedCount} 个房间设置属性（留空则不修改）</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-edit-layout">户型</Label>
            <Select
              value={form.watch('layout') || '__none__'}
              onValueChange={(value) => form.setValue('layout', value === '__none__' ? undefined : value)}
            >
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="不修改" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不修改</SelectItem>
                {LAYOUT_OPTIONS.map((layout) => (
                  <SelectItem key={layout} value={layout}>
                    {layout}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField label="面积 (m²)" htmlFor="batch-edit-area">
            <Input
              id="batch-edit-area"
              type="number"
              step="0.01"
              placeholder="不修改"
              value={form.watch('area') ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === '') {
                  form.setValue('area', undefined);
                  return;
                }

                const parsed = parseFloat(nextValue);
                form.setValue('area', isNaN(parsed) ? undefined : parsed);
              }}
            />
          </FormField>

          <FormField label="月租 (元)" htmlFor="batch-edit-monthly_rent">
            <Input
              id="batch-edit-monthly_rent"
              type="number"
              step="0.01"
              placeholder="不修改"
              value={form.watch('monthly_rent') ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === '') {
                  form.setValue('monthly_rent', undefined);
                  return;
                }

                const parsed = parseFloat(nextValue);
                form.setValue('monthly_rent', isNaN(parsed) ? undefined : parsed);
              }}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="batch-edit-maintenance">设为维修中</Label>
              <p className="text-sm text-muted-foreground">
                开启后房间将标记为维修中状态
              </p>
            </div>
            <Switch
              id="batch-edit-maintenance"
              checked={form.watch('maintenance') ?? false}
              onCheckedChange={(checked) => form.setValue('maintenance', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoomEditDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSubmit: (data: RoomFormData & { facilities?: RoomFacilities | null }) => void;
  isPending: boolean;
}) {
  return (
    <EditRoomDialog open={open} onOpenChange={onOpenChange} onSubmit={onSubmit} isPending={isPending} room={room} />
  );
}

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
