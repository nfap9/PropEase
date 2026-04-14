'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { useAsyncDialogSubmit } from '@apartment-ultra/shared-ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import { organizationsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { OrganizationMember, MemberRole, OrganizationUsage } from '@/types';
import { MoreHorizontal, Pencil, Trash2, UserPlus, Building2, Users, DoorOpen } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/lib/auth/context';
import { tenantI18n, tenantMessages } from '@/lib/i18n';

// 注意: 实际使用时从 testids 导入 TEAM_SETTINGS 常量
const TEAM_SETTINGS = {
  HEADING: 'team-settings-heading',
  EDIT_ORG_BTN: 'team-edit-org-btn',
  INVITE_BTN: 'team-invite-btn',
  MEMBER_LIST: 'team-settings-member-list',
  EDIT_ORG_DIALOG: 'team-edit-org-dialog',
  INVITE_DIALOG: 'team-invite-dialog',
  REMOVE_MEMBER_DIALOG: 'team-remove-member-dialog',
} as const;

const organizationSchema = z.object({
  name: z.string().min(1, tenantMessages.settings.team.teamNameValidation),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const phoneRegex = /^1[3-9]\d{9}$/;

const inviteSchema = z.object({
  phone: z.string().regex(phoneRegex, tenantMessages.settings.team.phoneValidation),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: tenantMessages.settings.team.roles.owner,
  admin: tenantMessages.settings.team.roles.admin,
  member: tenantMessages.settings.team.roles.member,
  viewer: tenantMessages.settings.team.roles.viewer,
};

const ROLE_COLORS: Record<MemberRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  owner: 'default',
  admin: 'default',
  member: 'secondary',
  viewer: 'outline',
};

export default function TeamSettingsPage() {
  const { user, organization, setOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: () => organizationsApi.getMembers(organization!.id),
    enabled: !!organization,
  });

  const { data: usage, isLoading: usageLoading } = useQuery<OrganizationUsage>({
    queryKey: ['organization-usage', organization?.id],
    queryFn: () => organizationsApi.getUsage(organization!.id),
    enabled: !!organization,
  });

  const editOrgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { phone: '', role: 'member' },
  });
  const editOrgSubmit = useAsyncDialogSubmit({
    close: () => setIsEditOrgOpen(false),
  });
  const inviteSubmit = useAsyncDialogSubmit({
    close: () => setIsInviteOpen(false),
    reset: () => inviteForm.reset(),
  });
  const removeMemberSubmit = useAsyncDialogSubmit({
    close: () => setIsRemoveMemberOpen(false),
    clear: () => setSelectedMember(null),
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationFormData }) => organizationsApi.update(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members', updatedOrg.id] });
      setOrganization(updatedOrg);
      editOrgSubmit.handleSuccess();
      appToast.success(tenantMessages.settings.team.toasts.teamUpdated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      organizationsApi.addMember(organization!.id, {
        user_phone: data.phone,
        role: data.role as MemberRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organization?.id],
      });
      inviteSubmit.handleSuccess();
      appToast.success(tenantMessages.settings.team.toasts.inviteSent);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '邀请失败，请重试')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => organizationsApi.removeMember(organization!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organization?.id],
      });
      removeMemberSubmit.handleSuccess();
      appToast.success(tenantMessages.settings.team.toasts.memberRemoved);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '移除失败，请重试')),
  });

  const handleEditOrg = () => {
    if (organization) {
      editOrgForm.reset({ name: organization.name });
      setIsEditOrgOpen(true);
    }
  };

  const handleRemoveMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setIsRemoveMemberOpen(true);
  };

  const currentMember = members?.find((m: OrganizationMember) => m.user_id === user?.id);
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const memberColumns: ColumnDef<OrganizationMember>[] = [
    {
      accessorKey: 'user',
      header: tenantMessages.settings.team.labels.memberName,
      cell: ({ row }) => {
        const member = row.original;
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
      accessorKey: 'role',
      header: tenantMessages.settings.team.labels.identity,
      cell: ({ row }) => <Badge variant={ROLE_COLORS[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      accessorKey: 'joined_at',
      header: tenantMessages.settings.team.labels.joinedAt,
      cell: ({ row }) => formatDateTime(row.original.joined_at),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const member = row.original;
        if (member.user_id === user?.id || !canManage) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tenantMessages.common.moreActions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRemoveMember(member)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {tenantMessages.settings.team.removeMemberAction}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PermissionPageGuard>
      <div className="space-y-6">

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations">
              <Building2 className="mr-2 h-4 w-4" />
              {tenantMessages.settings.team.tabs.organization}
            </TabsTrigger>
            <TabsTrigger value="members" disabled={!organization}>
              <Users className="mr-2 h-4 w-4" />
              {tenantMessages.settings.team.tabs.members}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            {organization ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{organization.name}</CardTitle>
                      <PermissionGuard permission={PERMISSIONS.SETTINGS_EDIT}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditOrg}
                          data-testid={TEAM_SETTINGS.EDIT_ORG_BTN}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </Button>
                      </PermissionGuard>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                          <Badge variant={ROLE_COLORS[organization.role]}>{ROLE_LABELS[organization.role]}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">备注</p>
                        <p className="font-medium">{organization.notes || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">资源统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Skeleton className="h-8 w-32" />
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
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">暂无团队信息</p>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            {organization && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {organization.name} - {tenantMessages.settings.team.tabs.members}
                    </h2>
                    <p className="text-sm text-muted-foreground">{tenantMessages.settings.team.description}</p>
                  </div>
                  {canManage && (
                    <Button onClick={() => setIsInviteOpen(true)} data-testid={TEAM_SETTINGS.INVITE_BTN}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {tenantMessages.settings.team.inviteButton}
                    </Button>
                  )}
                </div>

                {membersLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <DataTable columns={memberColumns} data={members || []} testid={TEAM_SETTINGS.MEMBER_LIST} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <FormDialog
        open={isEditOrgOpen}
        onOpenChange={setIsEditOrgOpen}
        title={tenantMessages.settings.team.editDialogTitle}
        description={tenantMessages.settings.team.editDialogDescription}
        onSubmit={editOrgForm.handleSubmit(
          (data) => organization && updateOrgMutation.mutate({ id: organization.id, data })
        )}
        submitLabel={
          updateOrgMutation.isPending
            ? tenantMessages.settings.team.editSubmitting
            : tenantMessages.settings.team.editSubmit
        }
        isPending={updateOrgMutation.isPending}
        contentTestId={TEAM_SETTINGS.EDIT_ORG_DIALOG}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-name">
            团队名称 <span aria-hidden="true">*</span>
          </Label>
          <Input id="edit-name" aria-required {...editOrgForm.register('name')} />
        </div>
      </FormDialog>

      <FormDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title={tenantMessages.settings.team.inviteDialogTitle}
        description={tenantMessages.settings.team.inviteDialogDescription}
        onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))}
        submitLabel={
          inviteMutation.isPending
            ? tenantMessages.settings.team.inviteSubmitting
            : tenantMessages.settings.team.inviteSubmit
        }
        isPending={inviteMutation.isPending}
        contentTestId={TEAM_SETTINGS.INVITE_DIALOG}
      >
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
            <p className="text-sm text-destructive">{inviteForm.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">
            {tenantMessages.settings.team.labels.inviteIdentity} <span aria-hidden="true">*</span>
          </Label>
          <Select
            value={inviteForm.watch('role')}
            onValueChange={(value: MemberRole) => inviteForm.setValue('role', value)}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{tenantMessages.settings.team.roles.admin}</SelectItem>
              <SelectItem value="member">{tenantMessages.settings.team.roles.member}</SelectItem>
              <SelectItem value="viewer">{tenantMessages.settings.team.roles.viewer}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={isRemoveMemberOpen}
        onOpenChange={setIsRemoveMemberOpen}
        title={tenantMessages.settings.team.removeDialogTitle}
        description={tenantI18n.t('settings.team.removeDialogDescription', {
          name: selectedMember?.user_full_name ?? '',
        })}
        cancelLabel="取消"
        confirmLabel={
          removeMemberMutation.isPending
            ? tenantMessages.settings.team.removeDialogSubmitting
            : tenantMessages.settings.team.removeDialogConfirm
        }
        onConfirm={() => removeMemberMutation.mutate(selectedMember!.id)}
        isPending={removeMemberMutation.isPending}
        intent="destructive"
        contentTestId={TEAM_SETTINGS.REMOVE_MEMBER_DIALOG}
      />
    </PermissionPageGuard>
  );
}
