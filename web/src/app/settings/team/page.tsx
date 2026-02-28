'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { organizationsApi } from '@/lib/api';
import { Organization, OrganizationMember, MemberRole } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, UserPlus, Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/context';

const organizationSchema = z.object({
  name: z.string().min(1, '请输入组织名称'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const phoneRegex = /^1[3-9]\d{9}$/;

const inviteSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '所有者',
  admin: '管理员',
  member: '成员',
  viewer: '查看者',
};

const ROLE_COLORS: Record<MemberRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  owner: 'default',
  admin: 'default',
  member: 'secondary',
  viewer: 'outline',
};

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  // 自动选择第一个组织
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0]);
    }
  }, [organizations, selectedOrg]);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', selectedOrg?.id],
    queryFn: () => organizationsApi.getMembers(selectedOrg!.id),
    enabled: !!selectedOrg,
  });

  const createOrgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: '' },
  });

  const editOrgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { phone: '', role: 'member' },
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: OrganizationFormData) =>
      organizationsApi.create({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreateOrgOpen(false);
      createOrgForm.reset();
      toast.success('组织创建成功');
    },
    onError: () => {
      toast.error('创建失败，请重试');
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationFormData }) =>
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsEditOrgOpen(false);
      setSelectedOrg(null);
      toast.success('组织更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      organizationsApi.addMember(selectedOrg!.id, {
        user_phone: data.phone,
        role: data.role as MemberRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', selectedOrg?.id],
      });
      setIsInviteOpen(false);
      inviteForm.reset();
      toast.success('邀请已发送');
    },
    onError: () => {
      toast.error('邀请失败，请重试');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      organizationsApi.removeMember(selectedOrg!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', selectedOrg?.id],
      });
      setIsRemoveMemberOpen(false);
      setSelectedMember(null);
      toast.success('成员已移除');
    },
    onError: () => {
      toast.error('移除失败，请重试');
    },
  });

  const handleEditOrg = (org: Organization) => {
    setSelectedOrg(org);
    editOrgForm.reset({
      name: org.name,
    });
    setIsEditOrgOpen(true);
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
      header: '用户',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {member.user_full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium">{member.user_full_name || '未知用户'}</div>
              <div className="text-sm text-muted-foreground">{member.user_phone || '-'}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => (
        <Badge variant={ROLE_COLORS[row.original.role]}>
          {ROLE_LABELS[row.original.role]}
        </Badge>
      ),
    },
    {
      accessorKey: 'joined_at',
      header: '加入时间',
      cell: ({ row }) => new Date(row.original.joined_at).toLocaleDateString('zh-CN'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const member = row.original;
        if (member.user_id === user?.id || !canManage) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleRemoveMember(member)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                移除成员
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (orgsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">团队设置</h1>

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations">
              <Building2 className="mr-2 h-4 w-4" />
              组织管理
            </TabsTrigger>
            <TabsTrigger value="members" disabled={!selectedOrg}>
              <Users className="mr-2 h-4 w-4" />
              成员管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">我的组织</h2>
              <Button onClick={() => setIsCreateOrgOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                创建组织
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations?.map((org) => (
                <Card
                  key={org.id}
                  className={`cursor-pointer transition-colors ${
                    selectedOrg?.id === org.id ? 'border-primary' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGuard permission={PERMISSIONS.SETTINGS_EDIT}>
                            <DropdownMenuItem onClick={() => handleEditOrg(org)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        查看
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrg(org)}
                      >
                        选择
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {organizations?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">还没有组织</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    创建一个组织开始管理您的公寓
                  </p>
                  <Button className="mt-4" onClick={() => setIsCreateOrgOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建组织
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            {selectedOrg && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedOrg.name} - 成员</h2>
                    <p className="text-sm text-muted-foreground">
                      管理组织成员和权限
                    </p>
                  </div>
                  {canManage && (
                    <Button onClick={() => setIsInviteOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      邀请成员
                    </Button>
                  )}
                </div>

                {membersLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <DataTable columns={memberColumns} data={members || []} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建组织</DialogTitle>
            <DialogDescription>创建一个新的组织来管理您的公寓</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createOrgForm.handleSubmit((data) => createOrgMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">组织名称 *</Label>
              <Input id="name" {...createOrgForm.register('name')} />
              {createOrgForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {createOrgForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createOrgMutation.isPending}>
                {createOrgMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑组织</DialogTitle>
            <DialogDescription>修改组织信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editOrgForm.handleSubmit((data) =>
              updateOrgMutation.mutate({ id: selectedOrg!.id, data })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">组织名称 *</Label>
              <Input id="edit-name" {...editOrgForm.register('name')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOrgOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请成员</DialogTitle>
            <DialogDescription>邀请新成员加入组织</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">手机号 *</Label>
              <Input id="phone" type="tel" placeholder="请输入手机号" {...inviteForm.register('phone')} />
              {inviteForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {inviteForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色 *</Label>
              <Select
                value={inviteForm.watch('role')}
                onValueChange={(value: MemberRole) => inviteForm.setValue('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? '邀请中...' : '发送邀请'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Alert Dialog */}
      <AlertDialog open={isRemoveMemberOpen} onOpenChange={setIsRemoveMemberOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从组织中移除成员 &ldquo;{selectedMember?.user_full_name}&rdquo; 吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberMutation.mutate(selectedMember!.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? '移除中...' : '确认移除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
    </PermissionPageGuard>
  );
}
