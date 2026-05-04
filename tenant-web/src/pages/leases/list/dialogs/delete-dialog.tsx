import { Button, Modal } from 'antd';

interface LeaseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LeaseDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: LeaseDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认删除"
      onOk={onConfirm}
      okText={isPending ? '删除中...' : '删除'}
      okButtonProps={{ danger: true, loading: isPending }}
    >
      <p>确定要删除此租约吗？此操作不可撤销。</p>
    </Modal>
  );
}
