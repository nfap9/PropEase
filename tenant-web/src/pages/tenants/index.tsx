import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Table, Button, Dropdown, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useConfirmAction } from '@/hooks/use-confirm-action';
import type { Tenant } from '@/types';
import { Building2, MoreHorizontal, Plus, User, Phone } from 'lucide-react';
import { TenantFormModal } from './components/tenant-form-modal';
import { TenantDeleteModal } from './components/tenant-delete-modal';
import { useTenantsData, useTenantsMutations } from './hooks/use-tenants-page';

const TENANTS = {
  HEADING: 'tenants-heading',
  NEW_BUTTON: 'tenants-new-btn',
  LIST: 'tenants-list',
  SEARCH_INPUT: 'tenants-search-input',
  CREATE_DIALOG: 'tenants-create-dialog',
  EDIT_DIALOG: 'tenants-edit-dialog',
} as const;

export default function TenantsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const { tenants, tenantsLoading } = useTenantsData();
  const { createTenant, updateTenant, deleteTenant, isCreating, isUpdating, isDeleting } =
    useTenantsMutations();

  const canCreateTenant = hasPermission(PERMISSIONS.TENANT_CREATE);
  const canEditTenant = hasPermission(PERMISSIONS.TENANT_EDIT);
  const canDeleteTenant = hasPermission(PERMISSIONS.TENANT_DELETE);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const deleteConfirm = useConfirmAction<Tenant>();

  const handleEdit = useCallback((tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback(
    (tenant: Tenant) => {
      deleteConfirm.openFor(tenant);
    },
    [deleteConfirm],
  );

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      render: (name: string, record: Tenant) => (
        <Link
          to={`/tenants/${record.id}`}
          className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
        >
          <User className="h-4 w-4 text-gray-400" />
          {name}
        </Link>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          {phone}
        </div>
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 180,
      render: (id_card: string) => id_card || '-',
    },
    {
      title: '紧急联系人',
      dataIndex: 'emergency_contact',
      key: 'emergency_contact',
      width: 140,
      render: (emergency_contact: string) => emergency_contact || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Tenant) => {
        const menuItems: MenuProps['items'] = [];
        if (canEditTenant) {
          menuItems.push({
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(record),
          });
        }
        if (canDeleteTenant) {
          menuItems.push({
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: () => handleDelete(record),
          });
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreHorizontal className="h-4 w-4" />} />
          </Dropdown>
        );
      },
    },
  ];

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
        <Skeleton active paragraph={{ rows: 10 }} />
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
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          {canCreateTenant && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              data-testid={TENANTS.NEW_BUTTON}
              icon={<Plus className="mr-2 h-4 w-4" />}
            >
              新增租客
            </Button>
          )}
        </div>

        {tenantsLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={tenants || []}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
            }}
            size="small"
            data-testid={TENANTS.LIST}
          />
        )}
      </div>

      <TenantFormModal
        open={isCreateOpen}
        onOpenChange={(open) => !open && setIsCreateOpen(false)}
        mode="create"
        onSubmit={(data) => createTenant(data, { onSuccess: () => setIsCreateOpen(false) })}
        isPending={isCreating}
        testId={TENANTS.CREATE_DIALOG}
      />

      <TenantFormModal
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditOpen(false);
            setSelectedTenant(null);
          }
        }}
        mode="edit"
        initialData={selectedTenant}
        onSubmit={(data) =>
          updateTenant(
            { id: selectedTenant!.id, data },
            { onSuccess: () => setIsEditOpen(false) },
          )
        }
        isPending={isUpdating}
        testId={TENANTS.EDIT_DIALOG}
      />

      <TenantDeleteModal
        open={deleteConfirm.dialogProps.open}
        onClose={deleteConfirm.close}
        tenant={deleteConfirm.selectedItem}
        onConfirm={() =>
          deleteTenant(deleteConfirm.selectedItem!.id, {
            onSuccess: deleteConfirm.close,
          })
        }
        isPending={isDeleting}
      />
    </PermissionPageGuard>
  );
}
