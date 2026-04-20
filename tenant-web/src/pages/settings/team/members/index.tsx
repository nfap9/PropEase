
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAsyncDialogSubmit } from '@apartment-ultra/shared-ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
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
import { organizationsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { formatDateTime } from '@/utils/date';
import { OrganizationMember, MemberRole } from '@/types';
import { MoreHorizontal, Trash2, UserPlus, Users } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
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

const ROLE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  '组织所有者': 'default',
  '公寓管理人': 'default',
  '一般合伙人': 'secondary',
};

// 角色ID映射（从数据库迁移得知）
const ROLE_OPTIONS = [
  { role_id: '01kpfr00000000000000002', role_name: '公寓管理人', label: tenantMessages.settings.team.roles.admin },
  { role_id: '01kpfr00000000000000003', role_name: '一般合伙人', label: tenantMessages.settings.team.roles.member },
];

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

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { phone: '', role_id: ROLE_OPTIONS[1]?.role_id || '' },
  });

  const inviteSubmit = useAsyncDialogSubmit({
    close: () => setIsInviteOpen(false),
    reset: () => inviteForm.reset(),
  });

  const removeMemberSubmit = useAsyncDialogSubmit({
    close: () => setIsRemoveMemberOpen(false),
    clear: () => setSelectedMember(null),
  });

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
      inviteSubmit.handleSuccess();
      toast.success(tenantMessages.settings.team.toasts.inviteSent);
    },
    onError: (error) => toast.error(getErrorMessage(error, '邀请失败，请重试')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => organizationsApi.removeMember(organization!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organization?.id],
      });
      removeMemberSubmit.handleSuccess();
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

  const memberColumns: ColumnDef<OrganizationMember>[] = [
    {
      accessorKey: 'user',
      header: tenantMessages.settings.team.labels.memberName,
      size: 200,
      minSize: 150,
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
      size: 100,
      minSize: 80,
      cell: ({ row }) => <Badge variant={ROLE_COLORS[row.original.role_name] ?? 'outline'}>{ROLE_LABELS[row.original.role_name] ?? row.original.role_name}</Badge>,
    },
    {
      accessorKey: 'joined_at',
      header: tenantMessages.settings.team.labels.joinedAt,
      size: 180,
      minSize: 150,
      cell: ({ row }) => formatDateTime(row.original.joined_at),
    },
    {
      id: 'actions',
      size: 80,
      minSize: 60,
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
                <Button onClick={() => setIsInviteOpen(true)} data-testid={TEAM_SETTINGS.INVITE_BTN}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {tenantMessages.settings.team.inviteButton}
                </Button>
              </PermissionGuard>
            </div>

            {membersLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <DataTable columns={memberColumns} data={members || []} testid={TEAM_SETTINGS.MEMBER_LIST} />
            )}
          </>
        )}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent data-testid={TEAM_SETTINGS.INVITE_DIALOG}>
          <DialogHeader>
            <DialogTitle>{tenantMessages.settings.team.inviteDialogTitle}</DialogTitle>
            <DialogDescription>{tenantMessages.settings.team.inviteDialogDescription}</DialogDescription>
          </DialogHeader>
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
                <p className="text-sm text-destructive">{inviteForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_id">
                {tenantMessages.settings.team.labels.inviteIdentity} <span aria-hidden="true">*</span>
              </Label>
              <Select
                value={inviteForm.watch('role_id')}
                onValueChange={(value: string) => inviteForm.setValue('role_id', value)}
              >
                <SelectTrigger id="role_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.role_id} value={option.role_id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending
                  ? tenantMessages.settings.team.inviteSubmitting
                  : tenantMessages.settings.team.inviteSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isRemoveMemberOpen}
        onOpenChange={setIsRemoveMemberOpen}
      >
        <AlertDialogContent data-testid={TEAM_SETTINGS.REMOVE_MEMBER_DIALOG}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tenantMessages.settings.team.removeDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tenantMessages.settings.team.removeDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberMutation.mutate(selectedMember!.id)}
              disabled={removeMemberMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending
                ? tenantMessages.settings.team.removeDialogSubmitting
                : tenantMessages.settings.team.removeDialogConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionPageGuard>
  );
}
