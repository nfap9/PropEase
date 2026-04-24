import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Button, Modal } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Building2, Plus } from 'lucide-react';
import {
  ApartmentCard,
  ApartmentEmptyState,
  ApartmentSearchBar,
  ApartmentForm,
  type ApartmentFormRef,
  type ApartmentFormData,
} from '@/pages/apartments/components';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { useApartmentsPage } from './hooks/use-apartments-page';

export default function ApartmentsPage() {
  const navigate = useNavigate();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [searchQuery, setSearchQuery] = useState('');

  const {
    apartments,
    apartmentsLoading,
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
  } = useApartmentsPage();

  const filteredApartments = apartments?.filter((apartment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return apartment.name.toLowerCase().includes(query) || (apartment.address?.toLowerCase().includes(query) ?? false);
  });

  if (authLoading) {
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

        {apartmentsLoading ? (
          <div className="mx-auto grid max-w-7xl gap-card-gap sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton active className="h-48" />
            <Skeleton active className="h-48" />
            <Skeleton active className="h-48" />
          </div>
        ) : filteredApartments && filteredApartments.length > 0 ? (
          <div
            className="mx-auto grid max-w-7xl gap-card-gap sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
            loading={updateMutation.isPending}
            data-testid="apartments-confirm-btn"
          >
            {updateMutation.isPending ? '保存中...' : '保存'}
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
        okText={deleteMutation.isPending ? '删除中...' : '删除'}
        okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
      >
        <p>
          确定要删除公寓 &quot;{selectedApartment?.name ?? ''}&quot; 吗？此操作不可撤销，关联的房间数据也将被删除。
        </p>
      </Modal>
    </PermissionPageGuard>
  );
}
