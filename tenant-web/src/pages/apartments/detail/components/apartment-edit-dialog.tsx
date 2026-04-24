import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { ApartmentForm, type ApartmentFormRef, type ApartmentFormData } from '@/pages/apartments/components';

export interface ApartmentEditDialogRef {
  submit: () => Promise<void>;
}

interface ApartmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 表单初始值，由调用方从 apartment 计算后传入 */
  initialValues: Partial<ApartmentFormData>;
  onSubmit: (data: ApartmentFormData) => void;
  isPending: boolean;
}

export const ApartmentEditDialog = forwardRef<ApartmentEditDialogRef, ApartmentEditDialogProps>(
  ({ open, onOpenChange, initialValues, onSubmit, isPending }, ref) => {
    const formRef = useRef<ApartmentFormRef>(null);

    useImperativeHandle(ref, () => ({
      submit: () => formRef.current?.submit() ?? Promise.resolve(),
    }));

    // Sync initialValues when dialog opens
    useEffect(() => {
      if (open) {
        formRef.current?.setFieldsValue(initialValues);
      }
    }, [open, initialValues]);

    return (
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="编辑公寓"
        footer={[
          <Button key="cancel" onClick={() => onOpenChange(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={isPending} onClick={() => formRef.current?.submit()}>
            {isPending ? '保存中...' : '保存'}
          </Button>,
        ]}
      >
        <p className="mb-4 text-sm text-gray-600">修改公寓信息</p>
        <ApartmentForm ref={formRef} onFinish={onSubmit} />
      </Modal>
    );
  }
);

ApartmentEditDialog.displayName = 'ApartmentEditDialog';
