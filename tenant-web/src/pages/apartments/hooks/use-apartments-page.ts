import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';
import { ApartmentWithStats } from '@/types';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import { useConfirmAction } from '@/hooks/use-confirm-action';
import type { ApartmentFormRef, ApartmentFormData } from '@/pages/apartments/components';

export interface ApartmentsPageState {
  // Data
  apartments: ApartmentWithStats[] | undefined;
  apartmentsLoading: boolean;
  filteredApartments: ApartmentWithStats[] | undefined;

  // Dialog state
  isEditOpen: boolean;
  isDeleteOpen: boolean;
  selectedApartment: ApartmentWithStats | null;
  apartmentFormRef: React.RefObject<ApartmentFormRef>;

  // Mutations
  updateMutation: ReturnType<typeof useMutation<unknown, Error, { id: string; data: ApartmentFormData }>>;
  deleteMutation: ReturnType<typeof useMutation<unknown, Error, string>>;

  // Actions
  handleEdit: (apartment: ApartmentWithStats) => void;
  handleDelete: (apartment: ApartmentWithStats) => void;
  handleConfirmDelete: () => void;
  handleFormFinish: (data: ApartmentFormData) => void;
  closeEditDialog: () => void;
  closeDeleteDialog: () => void;
}

export function useApartmentsPage(): ApartmentsPageState {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteConfirm = useConfirmAction<ApartmentWithStats>();
  const apartmentFormRef = useRef<ApartmentFormRef>(null);

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      closeEditDialog();
      toast.success('公寓更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      closeDeleteDialog();
      toast.success('公寓删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = useCallback((apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    apartmentFormRef.current?.setFieldsValue({
      name: apartment.name,
      address: apartment.address ?? '',
      description: apartment.description ?? '',
      floors: apartment.floors ?? undefined,
      land_area: apartment.land_area ?? undefined,
      total_area: apartment.total_area ?? undefined,
      landlord_name: apartment.landlord_name ?? '',
      landlord_contact: apartment.landlord_contact ?? '',
      contract_start: apartment.contract_start ? new Date(apartment.contract_start).toISOString().split('T')[0] : '',
      contract_end: apartment.contract_end ? new Date(apartment.contract_end).toISOString().split('T')[0] : '',
      landlord_rent: apartment.landlord_rent ?? undefined,
    });
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback((apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedApartment) {
      deleteMutation.mutate(selectedApartment.id);
    }
  }, [selectedApartment, deleteMutation]);

  const handleFormFinish = useCallback((data: ApartmentFormData) => {
    if (selectedApartment) {
      updateMutation.mutate({ id: selectedApartment.id, data });
    }
  }, [selectedApartment, updateMutation]);

  const closeEditDialog = useCallback(() => {
    setIsEditOpen(false);
    setSelectedApartment(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteOpen(false);
    setSelectedApartment(null);
  }, []);

  const filteredApartments = useMemo(() => {
    if (!apartments) return undefined;
    return apartments;
  }, [apartments]);

  return {
    apartments,
    apartmentsLoading,
    filteredApartments,
    isEditOpen,
    isDeleteOpen,
    selectedApartment,
    apartmentFormRef,
    updateMutation,
    deleteMutation,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleFormFinish,
    closeEditDialog,
    closeDeleteDialog,
  };
}
