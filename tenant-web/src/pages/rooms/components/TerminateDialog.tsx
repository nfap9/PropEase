import { Loader2 } from 'lucide-react';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testids?.TERMINATE_DIALOG}>
        <AlertDialogHeader>
          <AlertDialogTitle>确认退租</AlertDialogTitle>
          <AlertDialogDescription>
            确定要为房间 "{room?.room_number ?? ''}" 办理退租吗？退租后房间将变为空置状态。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-testid={testids?.CONFIRM_TERMINATE_BTN}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              '确认退租'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
