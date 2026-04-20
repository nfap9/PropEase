
import type { UseFormReturn } from 'react-hook-form';
import { Modal, Button } from 'antd';
import { ApartmentForm } from '@/pages/apartments/components';
import type { ApartmentFormData } from '@/schemas/apartment-detail';

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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑公寓"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
          {isPending ? '保存中...' : '保存'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">修改公寓信息</p>
      <ApartmentForm form={form} mode="edit" onSubmit={onSubmit} />
    </Modal>
  );
}
