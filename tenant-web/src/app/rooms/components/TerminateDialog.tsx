'use client';

import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import { Room } from '@/types';

interface TerminateDialogProps {
  testids?: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  room: Room | null;
}

export function TerminateDialog({ testids, open, onOpenChange, onConfirm, isPending, room }: TerminateDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="确认退租"
      description={`确定要为房间 "${room?.room_number ?? ''}" 办理退租吗？退租后房间将变为空置状态。`}
      cancelLabel="取消"
      confirmLabel={isPending ? '处理中...' : '确认退租'}
      onConfirm={onConfirm}
      isPending={isPending}
      contentTestId={testids?.TERMINATE_DIALOG}
      confirmTestId={testids?.CONFIRM_TERMINATE_BTN}
    />
  );
}
