
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Modal, Input, Card, Skeleton, Tag, Form } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/date';
import { MemberRole, OrganizationUsage } from '@/types';
import { Pencil, Building2, Users, DoorOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { tenantMessages } from '@/i18n';

const TEAM_SETTINGS = {
  HEADING: 'team-settings-heading',
  EDIT_ORG_BTN: 'team-edit-org-btn',
  EDIT_ORG_DIALOG: 'team-edit-org-dialog',
} as const;

const organizationSchema = z.object({
  name: z.string().min(1, tenantMessages.settings.team.teamNameValidation),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: tenantMessages.settings.team.roles.owner,
  admin: tenantMessages.settings.team.roles.admin,
  member: tenantMessages.settings.team.roles.member,
  viewer: tenantMessages.settings.team.roles.viewer,
};

const BADGE_COLOR_MAP: Record<MemberRole, 'blue' | 'default' | 'red' | 'gold'> = {
  owner: 'blue',
  admin: 'blue',
  member: 'default',
  viewer: 'gold',
};

export default function TeamSettingsPage() {
  const { organization, setOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);

  const { data: usage, isLoading: usageLoading } = useQuery<OrganizationUsage>({
    queryKey: ['organization-usage', organization?.id],
    queryFn: () => organizationsApi.getUsage(organization!.id),
    enabled: !!organization,
  });

  const [editOrgForm] = Form.useForm<OrganizationFormData>();

  const handleEditOrgSuccess = () => {
    setIsEditOrgOpen(false);
  };

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationFormData }) => organizationsApi.update(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members', updatedOrg.id] });
      setOrganization(updatedOrg);
      handleEditOrgSuccess();
      toast.success(tenantMessages.settings.team.toasts.teamUpdated);
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const handleEditOrg = () => {
    if (organization) {
      editOrgForm.setFieldsValue({ name: organization.name });
      setIsEditOrgOpen(true);
    }
  };

  return (
    <div className="space-y-6">
        {organization ? (
          <>
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span className="text-lg">{organization.name}</span>
                  <PermissionGuard permission={PERMISSIONS.SETTINGS_EDIT}>
                    <Button
                      size="small"
                      onClick={handleEditOrg}
                      data-testid={TEAM_SETTINGS.EDIT_ORG_BTN}
                      icon={<Pencil className="h-4 w-4" />}
                    >
                      编辑
                    </Button>
                  </PermissionGuard>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <p className="font-mono text-muted-foreground">{organization.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">团队类型</p>
                  <p className="font-medium">{organization.is_personal ? '个人团队' : '协作团队'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">创建时间</p>
                  <p className="font-medium">{formatDate(organization.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tenantMessages.settings.team.labels.yourIdentity}</p>
                  {organization.role ? (
                    <Tag color={BADGE_COLOR_MAP[organization.role]}>{ROLE_LABELS[organization.role]}</Tag>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">备注</p>
                  <p className="font-medium">{organization.notes || '—'}</p>
                </div>
              </div>
            </Card>

            <Card title={<span className="text-lg">资源统计</span>}>
              {usageLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Skeleton.Input active size="small" className="w-32" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Building2 className="mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{usage?.apartments_used ?? 0}</p>
                    <p className="text-xs text-muted-foreground">公寓</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <DoorOpen className="mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{usage?.rooms_used ?? 0}</p>
                    <p className="text-xs text-muted-foreground">房间</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{usage?.members_used ?? 0}</p>
                    <p className="text-xs text-muted-foreground">团队成员</p>
                  </div>
                </div>
              )}
            </Card>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">暂无团队信息</p>
        )}

        <Modal
          open={isEditOrgOpen}
          onCancel={() => setIsEditOrgOpen(false)}
          title={tenantMessages.settings.team.editDialogTitle}
          footer={null}
          data-testid={TEAM_SETTINGS.EDIT_ORG_DIALOG}
        >
          <div className="mb-4 text-muted-foreground">
            {tenantMessages.settings.team.editDialogDescription}
          </div>
          <Form
            form={editOrgForm}
            layout="vertical"
            className="space-y-4"
            onFinish={(values) => organization && updateOrgMutation.mutate({ id: organization.id, data: values as OrganizationFormData })}
          >
            <Form.Item
              name="name"
              label="团队名称"
              rules={[{ required: true, message: '请输入团队名称' }]}
            >
              <Input aria-required />
            </Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditOrgOpen(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending
                  ? tenantMessages.settings.team.editSubmitting
                  : tenantMessages.settings.team.editSubmit}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
  );
}
