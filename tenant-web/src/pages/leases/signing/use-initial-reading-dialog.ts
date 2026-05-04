import { Form } from 'antd';
import { useSaveInitialReading, type InitialReadingFormValues } from './use-initial-reading';

interface UseInitialReadingDialogOptions {
  orgId: string;
  roomId: string;
  startDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  form: ReturnType<typeof Form.useForm>[0];
}

export function useInitialReadingDialog({
  orgId,
  roomId,
  startDate,
  open,
  onOpenChange,
  onSuccess,
  form,
}: UseInitialReadingDialogOptions) {
  const saveMutation = useSaveInitialReading({ orgId });

  const handleSave = () => {
    form.validateFields().then((values) => {
      saveMutation.mutate(
        { roomId, startDate, values: values as InitialReadingFormValues },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.resetFields();
            onSuccess?.();
          },
        }
      );
    });
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return {
    handleSave,
    handleSkip,
    isPending: saveMutation.isPending,
  };
}
