
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
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { organizationsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/date';
import { MemberRole, OrganizationUsage } from '@/types';
import { Pencil, Building2, Users, DoorOpen } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
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

const ROLE_COLORS: Record<MemberRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  owner: 'default',
  admin: 'default',
  member: 'secondary',
  viewer: 'outline',
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

  const editOrgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  const editOrgSubmit = useAsyncDialogSubmit({
    close: () => setIsEditOrgOpen(false),
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationFormData }) => organizationsApi.update(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members', updatedOrg.id] });
      setOrganization(updatedOrg);
      editOrgSubmit.handleSuccess();
      toast.success(tenantMessages.settings.team.toasts.teamUpdated);
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const handleEditOrg = () => {
    if (organization) {
      editOrgForm.reset({ name: organization.name });
      setIsEditOrgOpen(true);
    }
  };

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
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
    </PermissionPageGuard>
  );
}
