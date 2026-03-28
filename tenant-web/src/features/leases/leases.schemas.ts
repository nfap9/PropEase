import { z } from 'zod';

export const LEASES = {
  HEADING: 'leases-heading',
  NEW_BUTTON: 'leases-new-btn',
  LIST: 'leases-list',
  STATUS_FILTER: 'leases-status-filter',
  CREATE_DIALOG: 'leases-create-dialog',
  APARTMENT_SELECT: 'leases-apartment-select',
  ROOM_SELECT: 'leases-room-select',
  TENANT_SELECT: 'leases-tenant-select',
  START_DATE_INPUT: 'leases-start-date-input',
  MONTHLY_RENT_INPUT: 'leases-monthly-rent-input',
  DEPOSIT_INPUT: 'leases-deposit-input',
  CONFIRM_BUTTON: 'leases-confirm-btn',
  EDIT_DIALOG: 'leases-edit-dialog',
  END_DATE_INPUT: 'leases-end-date-input',
  NOTES_INPUT: 'leases-notes-input',
  CANCEL_BUTTON: 'leases-cancel-btn',
  TERMINATE_DIALOG: 'leases-terminate-dialog',
  CONFIRM_TERMINATE_BTN: 'leases-confirm-terminate-btn',
  DELETE_DIALOG: 'leases-delete-dialog',
  CONFIRM_DELETE_BTN: 'leases-confirm-delete-btn',
} as const;

export const leaseSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_id: z.string().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, '月租不能为负'),
  deposit: z.coerce.number().min(0, '押金不能为负').optional(),
  water_rate: z.coerce.number().min(0).optional(),
  electricity_rate: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type LeaseEditFormData = z.infer<typeof leaseSchema>;

export interface LeaseFiltersState {
  apartmentId: string | null;
  keyword: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  endDateFrom: string | null;
  endDateTo: string | null;
}

export function getDefaultLeaseFilters(): LeaseFiltersState {
  return {
    apartmentId: null,
    keyword: null,
    startDateFrom: null,
    startDateTo: null,
    endDateFrom: null,
    endDateTo: null,
  };
}
