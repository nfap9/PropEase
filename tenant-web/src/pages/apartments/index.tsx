
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Modal, Skeleton, Button } from 'antd';
import type { MenuProps } from 'antd';
import { useConfirmAction } from '@/hooks/use-confirm-action';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';
import { ApartmentWithStats } from '@/types';
import { Building2, Plus } from 'lucide-react';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import {
  ApartmentCard,
  ApartmentEmptyState,
  ApartmentSearchBar,
  ApartmentForm,
  apartmentSchema,
  type ApartmentFormData,
} from '@/pages/apartments/components';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';

export default function ApartmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteConfirm = useConfirmAction<ApartmentWithStats>();

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const editForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedApartment(null);
      toast.success('公寓更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedApartment(null);
      toast.success('公寓删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    editForm.reset({
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
  };

  const handleDelete = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedApartment) {
      deleteMutation.mutate(selectedApartment.id);
    }
  };

  const filteredApartments = apartments?.filter((apartment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return apartment.name.toLowerCase().includes(query) || (apartment.address?.toLowerCase().includes(query) ?? false);
  });

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-gray-500">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ApartmentSearchBar value={searchQuery} onChange={setSearchQuery} />
            <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
              <Button
                onClick={() => navigate('/workspace/apartments/new')}
                data-testid="apartments-new-btn"
                className="shrink-0"
                icon={<Plus className="mr-2 h-4 w-4" />}
              >
                新增公寓
              </Button>
            </PermissionGuard>
          </div>

          {apartmentsLoading ? (
            <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Skeleton active className="h-48" />
              <Skeleton active className="h-48" />
              <Skeleton active className="h-48" />
            </div>
          ) : filteredApartments && filteredApartments.length > 0 ? (
            <div
              className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-testid="apartments-list"
            >
              {filteredApartments.map((apartment) => (
                <ApartmentCard key={apartment.id} apartment={apartment} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <ApartmentEmptyState
              hasApartments={!!apartments && apartments.length > 0}
              onCreateClick={() => navigate('/workspace/apartments/new')}
            />
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          open={isEditOpen}
          onCancel={() => setIsEditOpen(false)}
          title="编辑公寓"
          footer={[
            <Button key="cancel" onClick={() => setIsEditOpen(false)} data-testid="apartments-cancel-btn">
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={() => editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedApartment!.id, data }))()} loading={updateMutation.isPending} data-testid="apartments-confirm-btn">
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>,
          ]}
        >
          <div className="max-h-[60vh] overflow-y-auto py-4">
            <ApartmentForm
              form={editForm}
              mode="edit"
              formId="edit-apartment-form"
              onSubmit={(data) => updateMutation.mutate({ id: selectedApartment!.id, data })}
            />
          </div>
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal
          open={isDeleteOpen}
          onCancel={() => setIsDeleteOpen(false)}
          title="确认删除"
          onOk={handleConfirmDelete}
          okText={deleteMutation.isPending ? '删除中...' : '删除'}
          okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
        >
          <p>
            确定要删除公寓 "{selectedApartment?.name ?? ''}" 吗？此操作不可撤销，关联的房间数据也将被删除。
          </p>
        </Modal>
    </PermissionPageGuard>
  );
}
