/**
 * ApartmentsListView - 公寓列表视图
 *
 * 自包含视图，内部管理：
 * - 搜索状态
 * - 编辑/删除 Dialog 状态
 */
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Button, Modal } from 'antd';
import { Building2, Plus } from 'lucide-react';
import { ApartmentCard, ApartmentEmptyState, ApartmentSearchBar, ApartmentForm } from '../components';
import type { ApartmentFormRef, ApartmentFormData } from '../components';
import type { ApartmentWithStats } from '@/types';
import { useApartmentList } from '../hooks/use-apartment-list';
import { useApartmentMutations } from '../hooks/use-apartment-mutations';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';

export function ApartmentsListView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const apartmentFormRef = useRef<ApartmentFormRef>(null);

  const { apartments, filteredApartments, isLoading } = useApartmentList(searchQuery);
  const { updateApartment, deleteApartment, isUpdating, isDeleting } = useApartmentMutations();

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
      contract_start: apartment.contract_start
        ? new Date(apartment.contract_start).toISOString().split('T')[0]
        : '',
      contract_end: apartment.contract_end
        ? new Date(apartment.contract_end).toISOString().split('T')[0]
        : '',
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
      deleteApartment(selectedApartment.id, () => {
        setIsDeleteOpen(false);
        setSelectedApartment(null);
      });
    }
  }, [selectedApartment, deleteApartment]);

  const handleFormFinish = useCallback(
    (data: ApartmentFormData) => {
      if (selectedApartment) {
        updateApartment(selectedApartment.id, data, () => {
          setIsEditOpen(false);
          setSelectedApartment(null);
        });
      }
    },
    [selectedApartment, updateApartment],
  );

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setSelectedApartment(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setSelectedApartment(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-page">
        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
        <div className="grid gap-card-gap md:grid-cols-2 lg:grid-cols-3">
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-page">
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

      {filteredApartments && filteredApartments.length > 0 ? (
        <div
          className="mx-auto grid max-w-7xl gap-card-gap sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-testid="apartments-list"
        >
          {filteredApartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <ApartmentEmptyState
          hasApartments={!!apartments && apartments.length > 0}
          onCreateClick={() => navigate('/workspace/apartments/new')}
        />
      )}

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        onCancel={closeEditDialog}
        title="编辑公寓"
        footer={[
          <Button key="cancel" onClick={closeEditDialog} data-testid="apartments-cancel-btn">
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => apartmentFormRef.current?.submit()}
            loading={isUpdating}
            data-testid="apartments-confirm-btn"
          >
            {isUpdating ? '保存中...' : '保存'}
          </Button>,
        ]}
      >
        <div className="max-h-[60vh] overflow-y-auto py-4">
          <ApartmentForm ref={apartmentFormRef} onFinish={handleFormFinish} />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={isDeleteOpen}
        onCancel={closeDeleteDialog}
        title="确认删除"
        onOk={handleConfirmDelete}
        okText={isDeleting ? '删除中...' : '删除'}
        okButtonProps={{ danger: true, loading: isDeleting }}
      >
        <p>
          确定要删除公寓 &quot;{selectedApartment?.name ?? ''}&quot; 吗？此操作不可撤销，关联的房间数据也将被删除。
        </p>
      </Modal>
    </div>
  );
}
