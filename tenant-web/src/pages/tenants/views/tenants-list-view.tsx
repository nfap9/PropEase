/**
 * TenantsListView - 租客列表视图
 *
 * 自包含视图，内部管理：
 * - 搜索状态
 * - 3 个 dialog 状态（create/edit/delete）
 * - 列定义
 */
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useConfirmAction } from '@apartment-ultra/web-shared';
import type { Tenant } from '@/types';
import { MoreHorizontal, Plus, User, Phone } from 'lucide-react';
import { TenantFormModal } from '../components/tenant-form-modal';
import { TenantDeleteModal } from '../components/tenant-delete-modal';
import { useTenantsData, useTenantsMutations } from '../hooks/use-tenants-page';

const TENANTS = {
  HEADING: 'tenants-heading',
  NEW_BUTTON: 'tenants-new-btn',
  LIST: 'tenants-list',
  SEARCH_INPUT: 'tenants-search-input',
  CREATE_DIALOG: 'tenants-create-dialog',
  EDIT_DIALOG: 'tenants-edit-dialog',
} as const;

export function TenantsListView() {
  const { hasPermission } = usePermissions();
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

  return (
    <>
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
          <Table
            columns={columns}
            dataSource={[]}
            rowKey="id"
            loading={tenantsLoading}
            pagination={{ pageSize: 20 }}
            size="small"
          />
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
    </>
  );
}
