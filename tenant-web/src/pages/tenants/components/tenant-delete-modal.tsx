import { Button, Modal } from 'antd';
import type { Tenant } from '@/types';

const TENANTS = {
  CONFIRM_DELETE_BTN: 'tenants-confirm-delete-btn',
  DELETE_DIALOG: 'tenants-delete-dialog',
} as const;

interface TenantDeleteModalProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function TenantDeleteModal({
  open,
  onClose,
  tenant,
  onConfirm,
  isPending,
}: TenantDeleteModalProps) {
  return (
    <Modal
      title="确认删除"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          loading={isPending}
          onClick={onConfirm}
          data-testid={TENANTS.CONFIRM_DELETE_BTN}
        >
          {isPending ? '删除中...' : '删除'}
        </Button>,
      ]}
      data-testid={TENANTS.DELETE_DIALOG}
    >
      <p>确定要删除租客 &quot;{tenant?.name ?? ''}&quot; 吗？此操作不可撤销。</p>
    </Modal>
  );
}
