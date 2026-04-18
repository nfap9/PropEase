
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
import { DataTable } from '@/components/common/data-table';
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
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';
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
    defaultValues: { phone: '', role: 'member' },
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
        role: data.role as MemberRole,
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
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

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
      cell: ({ row }) => <Badge variant={ROLE_COLORS[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>,
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
