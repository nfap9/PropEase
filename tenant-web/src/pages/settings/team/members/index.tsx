
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Modal, Input, Card, Skeleton, Tag, Select, Dropdown, type MenuProps } from 'antd';
import { Label } from '@/components/common/label';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { organizationsApi } from '@/api';
import { permissionsApi } from '@/api/permissions';
import type { OrgRole } from '@/api/permissions';
import { getErrorMessage } from '@/utils/error';
import { formatDateTime } from '@/utils/date';
import { OrganizationMember, MemberRole } from '@/types';
import { MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { tenantMessages } from '@/i18n';

const TEAM_SETTINGS = {
  INVITE_BTN: 'team-invite-btn',
  MEMBER_LIST: 'team-settings-member-list',
  INVITE_DIALOG: 'team-invite-dialog',
  REMOVE_MEMBER_DIALOG: 'team-remove-member-dialog',
} as const;

const phoneRegex = /^1[3-9]\d{9}$/;

const inviteSchema = z.object({
  phone: z.string().regex(phoneRegex, tenantMessages.settings.team.phoneValidation),
  role_id: z.string(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<string, string> = {
  '组织所有者': tenantMessages.settings.team.roles.owner,
  '公寓管理人': tenantMessages.settings.team.roles.admin,
  '一般合伙人': tenantMessages.settings.team.roles.member,
};

const BADGE_COLOR_MAP: Record<string, 'blue' | 'default' | 'red' | 'gold'> = {
  '组织所有者': 'blue',
  '公寓管理人': 'blue',
  '一般合伙人': 'default',
};

// 获取角色选项，过滤掉"组织所有者"（不能分配给新成员）
function getAssignableRoles(roles: OrgRole[]) {
  return roles.filter((role) => role.name !== '组织所有者');
}

export default function TeamMembersPage() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: () => organizationsApi.getMembers(organization!.id),
    enabled: !!organization,
  });

  const { data: roles } = useQuery({
    queryKey: ['org-roles'],
    queryFn: () => permissionsApi.getOrgRoles(),
    enabled: !!organization,
  });

  const assignableRoles = roles ? getAssignableRoles(roles) : [];

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { phone: '', role_id: assignableRoles[0]?.id || '' },
  });

  const handleInviteSuccess = () => {
    setIsInviteOpen(false);
    inviteForm.reset();
  };

  const handleRemoveSuccess = () => {
    setIsRemoveMemberOpen(false);
    setSelectedMember(null);
  };

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      organizationsApi.addMember(organization!.id, {
        user_phone: data.phone,
        role_id: data.role_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organization?.id],
      });
      handleInviteSuccess();
      toast.success(tenantMessages.settings.team.toasts.inviteSent);
    },
    onError: (error) => toast.error(getErrorMessage(error, '邀请失败，请重试')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: string; memberId: string }) =>
      organizationsApi.removeMember(orgId, memberId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', orgId],
      });
      handleRemoveSuccess();
      toast.success(tenantMessages.settings.team.toasts.memberRemoved);
    },
    onError: (error) => toast.error(getErrorMessage(error, '移除失败，请重试')),
  });

  const handleRemoveMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setIsRemoveMemberOpen(true);
  };

  const currentMember = members?.find((m: OrganizationMember) => m.user_id === user?.id);
  const canManage = currentMember?.role_name === '组织所有者' || currentMember?.role_name === '公寓管理人';

  const memberColumns: ColumnsType<OrganizationMember> = [
    {
      key: 'user',
      title: tenantMessages.settings.team.labels.memberName,
      width: 200,
      minWidth: 150,
      render: (_, record) => {
        const member = record;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {member.user_full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium">{member.user_full_name || tenantMessages.common.unknownUser}</div>
              <div className="text-sm text-muted-foreground">{member.user_phone || '-'}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      title: tenantMessages.settings.team.labels.identity,
      width: 100,
      minWidth: 80,
      render: (_, record) => (
        <Tag color={BADGE_COLOR_MAP[record.role_name] ?? 'gold'}>
          {ROLE_LABELS[record.role_name] ?? record.role_name}
        </Tag>
      ),
    },
    {
      key: 'joined_at',
      title: tenantMessages.settings.team.labels.joinedAt,
      width: 180,
      minWidth: 150,
      render: (_, record) => formatDateTime(record.joined_at),
    },
    {
      key: 'actions',
      width: 80,
      minWidth: 60,
      render: (_, record) => {
        const member = record;
        if (member.user_id === user?.id || !canManage) return null;
        const menuItems: MenuProps['items'] = [
          {
            key: 'remove',
            label: tenantMessages.settings.team.removeMemberAction,
            icon: <Trash2 className="h-4 w-4" />,
            danger: true,
            onClick: () => handleRemoveMember(member),
          },
        ];
        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button variant="text" size="small" icon={<MoreHorizontal className="h-4 w-4" />} aria-label={tenantMessages.common.moreActions} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
        {organization && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {organization.name} - {tenantMessages.settings.team.tabs.members}
                </h2>
                <p className="text-sm text-muted-foreground">{tenantMessages.settings.team.description}</p>
              </div>
              <PermissionGuard permission={PERMISSIONS.SETTINGS_EDIT}>
                <Button type="primary" onClick={() => setIsInviteOpen(true)} data-testid={TEAM_SETTINGS.INVITE_BTN}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {tenantMessages.settings.team.inviteButton}
                </Button>
              </PermissionGuard>
            </div>

            {membersLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table
                columns={memberColumns}
                dataSource={members || []}
                rowKey="user_id"
                pagination={false}
                data-testid={TEAM_SETTINGS.MEMBER_LIST}
              />
            )}
          </>
        )}
      </div>

      <Modal
        open={isInviteOpen}
        onCancel={() => setIsInviteOpen(false)}
        title={tenantMessages.settings.team.inviteDialogTitle}
        footer={null}
        data-testid={TEAM_SETTINGS.INVITE_DIALOG}
      >
        <div className="mb-4 text-muted-foreground">
          {tenantMessages.settings.team.inviteDialogDescription}
        </div>
        <form onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">
              手机号 <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={tenantMessages.settings.team.phonePlaceholder}
              aria-required
              {...inviteForm.register('phone')}
            />
            {inviteForm.formState.errors.phone && (
              <p className="text-sm text-red-500">{inviteForm.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">
              {tenantMessages.settings.team.labels.inviteIdentity} <span aria-hidden="true">*</span>
            </Label>
            <Select
              id="role_id"
              className="w-full"
              value={inviteForm.watch('role_id')}
              onChange={(value: string) => inviteForm.setValue('role_id', value)}
              options={assignableRoles.map((role) => ({ label: role.name, value: role.id }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsInviteOpen(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending
                ? tenantMessages.settings.team.inviteSubmitting
                : tenantMessages.settings.team.inviteSubmit}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isRemoveMemberOpen}
        onCancel={() => setIsRemoveMemberOpen(false)}
        title={tenantMessages.settings.team.removeDialogTitle}
        data-testid={TEAM_SETTINGS.REMOVE_MEMBER_DIALOG}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsRemoveMemberOpen(false)}>
              取消
            </Button>
            <Button
              danger
              type="primary"
              onClick={() => organization && removeMemberMutation.mutate({ orgId: organization.id, memberId: selectedMember!.user_id })}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending
                ? tenantMessages.settings.team.removeDialogSubmitting
                : tenantMessages.settings.team.removeDialogConfirm}
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">
          {tenantMessages.settings.team.removeDialogDescription}
        </p>
      </Modal>
    </PermissionPageGuard>
  );
}
