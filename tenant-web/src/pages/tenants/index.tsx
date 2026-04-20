
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Table, Button, Input, Modal, Dropdown, Skeleton, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { useConfirmAction } from '@/hooks/use-confirm-action';
import { ColumnDef } from '@tanstack/react-table';
import { tenantsApi } from '@/api/tenants';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { Tenant } from '@/types';
import { Plus, Pencil, Trash2, Phone, User, Building2, MoreHorizontal } from 'lucide-react';
import { Label } from '@/components/common/label';

// 注意: 实际使用时从 testids 导入 TENANTS 常量
const TENANTS = {
  HEADING: 'tenants-heading',
  NEW_BUTTON: 'tenants-new-btn',
  LIST: 'tenants-list',
  SEARCH_INPUT: 'tenants-search-input',
  CREATE_DIALOG: 'tenants-create-dialog',
  NAME_INPUT: 'tenants-name-input',
  PHONE_INPUT: 'tenants-phone-input',
  ID_CARD_INPUT: 'tenants-id-card-input',
  EMERGENCY_CONTACT_INPUT: 'tenants-emergency-contact-input',
  EMERGENCY_PHONE_INPUT: 'tenants-emergency-phone-input',
  NOTES_INPUT: 'tenants-notes-input',
  CANCEL_BUTTON: 'tenants-cancel-btn',
  CONFIRM_BUTTON: 'tenants-confirm-btn',
  EDIT_DIALOG: 'tenants-edit-dialog',
  DELETE_DIALOG: 'tenants-delete-dialog',
  CONFIRM_DELETE_BTN: 'tenants-confirm-delete-btn',
  EDIT_BUTTON: 'tenants-edit-btn',
  DELETE_BUTTON: 'tenants-delete-btn',
} as const;

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  // 权限检查
  const canCreateTenant = hasPermission(PERMISSIONS.TENANT_CREATE);
  const canEditTenant = hasPermission(PERMISSIONS.TENANT_EDIT);
  const canDeleteTenant = hasPermission(PERMISSIONS.TENANT_DELETE);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const deleteConfirm = useConfirmAction<Tenant>();

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(),
    enabled: !!orgId,
  });

  const createForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
    },
  });

  const editForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('租客创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantFormData }) =>
      tenantsApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      setIsEditOpen(false);
      setSelectedTenant(null);
      toast.success('租客信息更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      deleteConfirm.close();
      toast.success('租客删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    editForm.reset({
      name: tenant.name,
      phone: tenant.phone ?? '',
      id_card: tenant.id_card ?? '',
      emergency_contact: tenant.emergency_contact ?? '',
      emergency_phone: tenant.emergency_phone ?? '',
      notes: tenant.notes ?? '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = deleteConfirm.openFor;

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
      render: (_: any, record: Tenant) => {
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

  // 无组织时的提示
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
              <Button onClick={() => setIsCreateOpen(true)} data-testid={TENANTS.NEW_BUTTON} icon={<Plus className="mr-2 h-4 w-4" />}>
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
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }}
              size="small"
              data-testid={TENANTS.LIST}
            />
          )}
        </div>

        {/* Create Modal */}
        <Modal
          title="新增租客"
          open={isCreateOpen}
          onCancel={() => setIsCreateOpen(false)}
          footer={null}
          data-testid={TENANTS.CREATE_DIALOG}
        >
          <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" required>
                  姓名
                </Label>
                <Input id="name" placeholder="请输入租客姓名" {...createForm.register('name')} data-testid={TENANTS.NAME_INPUT} />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" required>
                  联系电话
                </Label>
                <Input id="phone" placeholder="请输入联系电话" {...createForm.register('phone')} data-testid={TENANTS.PHONE_INPUT} />
                {createForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_card">身份证号</Label>
                <Input id="id_card" placeholder="请输入身份证号" {...createForm.register('id_card')} data-testid={TENANTS.ID_CARD_INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">紧急联系人</Label>
                <Input
                  id="emergency_contact"
                  placeholder="请输入紧急联系人"
                  {...createForm.register('emergency_contact')}
                  data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">紧急联系电话</Label>
                <Input
                  id="emergency_phone"
                  placeholder="请输入紧急联系电话"
                  {...createForm.register('emergency_phone')}
                  data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input id="notes" placeholder="请输入备注" {...createForm.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsCreateOpen(false)} data-testid={TENANTS.CANCEL_BUTTON}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="编辑租客"
          open={isEditOpen}
          onCancel={() => setIsEditOpen(false)}
          footer={null}
          data-testid={TENANTS.EDIT_DIALOG}
        >
          <form
            onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedTenant!.id, data }))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" required>
                  姓名
                </Label>
                <Input id="edit-name" placeholder="请输入租客姓名" {...editForm.register('name')} data-testid={TENANTS.NAME_INPUT} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" required>
                  联系电话
                </Label>
                <Input
                  id="edit-phone"
                  placeholder="请输入联系电话"
                  {...editForm.register('phone')}
                  data-testid={TENANTS.PHONE_INPUT}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-id_card">身份证号</Label>
                <Input id="edit-id_card" placeholder="请输入身份证号" {...editForm.register('id_card')} data-testid={TENANTS.ID_CARD_INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emergency_contact">紧急联系人</Label>
                <Input
                  id="edit-emergency_contact"
                  placeholder="请输入紧急联系人"
                  {...editForm.register('emergency_contact')}
                  data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergency_phone">紧急联系电话</Label>
                <Input
                  id="edit-emergency_phone"
                  placeholder="请输入紧急联系电话"
                  {...editForm.register('emergency_phone')}
                  data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">备注</Label>
              <Input id="edit-notes" placeholder="请输入备注" {...editForm.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditOpen(false)} data-testid={TENANTS.CANCEL_BUTTON}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="确认删除"
          open={deleteConfirm.dialogProps.open}
          onCancel={deleteConfirm.close}
          footer={[
            <Button key="cancel" onClick={deleteConfirm.close}>
              取消
            </Button>,
            <Button
              key="delete"
              type="primary"
              danger
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteConfirm.selectedItem!.id)}
              data-testid={TENANTS.CONFIRM_DELETE_BTN}
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </Button>,
          ]}
          data-testid={TENANTS.DELETE_DIALOG}
        >
          <p>确定要删除租客 "{deleteConfirm.selectedItem?.name ?? ''}" 吗？此操作不可撤销。</p>
        </Modal>
    </PermissionPageGuard>
  );
}
