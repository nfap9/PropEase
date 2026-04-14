'use client';

import { UseFormReturn } from 'react-hook-form';
import { User, Phone, IdCard, AlertCircle, Search, UserCheck2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseSigningFormData } from '../leases.schemas';

interface TenantInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  onSearchTenant: () => void;
}

export function TenantInfoSection({ form, onSearchTenant }: TenantInfoSectionProps) {
  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">填写租客信息</h3>
            <p className="text-sm text-muted-foreground">录入或选择已有租客</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSearchTenant}
          className="rounded-xl gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
        >
          <Search className="h-4 w-4" />
          选择已有租客
        </Button>
      </div>

      {/* Existing tenant hint */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-200/70 bg-amber-50/30 p-4">
        <UserCheck2 className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">快速录入</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            点击上方「选择已有租客」可快速从系统中填充租客信息，或直接填写下方表单录入新租客。
          </p>
        </div>
      </div>

      {/* Primary Info Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground pb-2 border-b border-border/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700 text-xs font-bold">1</span>
          基本信息
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_name" className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              租客姓名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tenant_name"
              placeholder="请输入租客姓名"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_name')}
            />
            {errors.tenant_name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tenant_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_phone" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              联系电话 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tenant_phone"
              placeholder="请输入联系电话"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_phone')}
            />
            {errors.tenant_phone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tenant_phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Info Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground pb-2 border-b border-border/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-bold">2</span>
          补充信息（选填）
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_id_card" className="flex items-center gap-1.5 text-sm font-medium">
              <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
              身份证号
            </Label>
            <Input
              id="tenant_id_card"
              placeholder="请输入身份证号"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_id_card')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_notes" className="text-sm font-medium">
              备注
            </Label>
            <Input
              id="tenant_notes"
              placeholder="租客相关备注"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_notes')}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground pb-2 border-b border-border/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-bold">3</span>
          紧急联系人（选填）
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_emergency_contact" className="text-sm font-medium">
              紧急联系人
            </Label>
            <Input
              id="tenant_emergency_contact"
              placeholder="请输入紧急联系人姓名"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_emergency_contact')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_emergency_phone" className="text-sm font-medium">
              紧急联系电话
            </Label>
            <Input
              id="tenant_emergency_phone"
              placeholder="请输入紧急联系电话"
              className="rounded-xl h-11 shadow-sm"
              {...form.register('tenant_emergency_phone')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
