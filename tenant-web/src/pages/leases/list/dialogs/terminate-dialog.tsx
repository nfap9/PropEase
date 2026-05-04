import { Button, Modal } from 'antd';

interface LeaseTerminateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LeaseTerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: LeaseTerminateDialogProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认终止租约"
      onOk={onConfirm}
      okText={isPending ? '处理中...' : '确认终止'}
      okButtonProps={{ loading: isPending }}
    >
      <p>确定要终止此租约吗？终止后房间将变为空置状态。</p>
    </Modal>
  );
}
