import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { ApartmentForm, type ApartmentFormRef, type ApartmentFormData } from '@/pages/apartments/components';
import type { Apartment } from '@/types';
import { buildApartmentFormValues } from '@/utils/apartment-detail';

export interface ApartmentEditDialogRef {
  setFieldsValue: (values: Partial<ApartmentFormData>) => void;
  submit: () => Promise<void>;
}

interface ApartmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment: Apartment | null;
  onSubmit: (data: ApartmentFormData) => void;
  isPending: boolean;
}

export const ApartmentEditDialog = forwardRef<ApartmentEditDialogRef, ApartmentEditDialogProps>(
  ({ open, onOpenChange, apartment, onSubmit, isPending }, ref) => {
    const formRef = useRef<ApartmentFormRef>(null);

    useImperativeHandle(ref, () => ({
      setFieldsValue: (values) => formRef.current?.setFieldsValue(values),
      submit: () => formRef.current?.submit() ?? Promise.resolve(),
    }));

    // Sync apartment data when it changes
    useEffect(() => {
      if (apartment && open) {
        formRef.current?.setFieldsValue(buildApartmentFormValues(apartment));
      }
    }, [apartment, open]);

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
