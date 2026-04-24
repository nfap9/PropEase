import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { utilitiesApi } from '@/api/utilities';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';

export interface InitialReadingFormValues {
  reading_date: string;
  water_reading?: number;
  electricity_reading?: number;
}

export interface InitialReadingSaveParams {
  orgId: string;
  roomId: string;
  startDate: string;
  isHistoricalEntry?: boolean;
  values: InitialReadingFormValues;
}

function extractPeriod(startDate: string): { year: number; month: number } {
  const date = new Date(startDate);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function useSaveInitialReading({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, startDate, values }: Omit<InitialReadingSaveParams, 'orgId' | 'isHistoricalEntry'>) => {
      const { year, month } = extractPeriod(startDate);
      return utilitiesApi.create(
        filterEmptyStrings({
          room_id: roomId,
          period_year: year,
          period_month: month,
          reading_date: values.reading_date,
          water_reading: values.water_reading,
          electricity_reading: values.electricity_reading,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      toast.success('初始水电读数已录入');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, '录入失败，请重试')),
  });
}
