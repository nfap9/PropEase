import { Loader2 } from 'lucide-react';
import { Modal, Button } from 'antd';
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认退租"
      onOk={onConfirm}
      okText={
        isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            处理中...
          </>
        ) : (
          '确认退租'
        )
      }
      okButtonProps={{ loading: isPending }}
    >
      <p>确定要为房间 "{room?.room_number ?? ''}" 办理退租吗？退租后房间将变为空置状态。</p>
    </Modal>
  );
}
