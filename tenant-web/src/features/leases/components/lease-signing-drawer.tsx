'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { WizardDrawer } from '@apartment-ultra/shared-ui/components/ui';
import { leaseSigningSchema, type LeaseSigningFormData } from '../leases.schemas';
import { leasesApi, apartmentsApi, roomsApi, tenantsApi, utilityConfigApi } from '@/lib/api';
import { toDateInputValue } from '@/lib/date-utils';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { TenantSearchDrawer } from './tenant-search-drawer';
import { RoomInfoSection } from './room-info-section';
import { TenantInfoSection } from './tenant-info-section';
import { ContractInfoSection } from './contract-info-section';
import type { FeeItem } from '@/components/common/fee-items-editor';
import type { Room, Tenant, UtilityConfig } from '@apartment-ultra/api-contract';

const leaseSigningSteps = [
  {
    id: 'room',
    title: '房间信息',
    description: '先确认要签约的公寓和房间。',
  },
  {
    id: 'tenant',
    title: '租客信息',
    description: '填写或选择租客资料。',
  },
  {
    id: 'contract',
    title: '合同信息',
    description: '确认租约日期、租金和附加费用。',
  },
] as const;

const leaseSigningStepFields: Record<number, Array<keyof LeaseSigningFormData>> = {
  0: ['room_id'],
  1: ['tenant_name', 'tenant_phone'],
  2: [],
};

interface LeaseSigningDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSuccess?: () => void;
  /** 签约成功回调，用于后续录入初始水电等 */
  onLeaseCreated?: (params: {
    room_id: string;
    room_display: string;
    start_date: string;
    is_historical_entry: boolean;
  }) => void;
}

export function LeaseSigningDrawer({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
  onLeaseCreated,
}: LeaseSigningDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [utilityConfig, setUtilityConfig] = useState<UtilityConfig | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [tenantSearchOpen, setTenantSearchOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isRoomSpecified = !!room;

  const form = useForm<LeaseSigningFormData>({
    resolver: zodResolver(leaseSigningSchema),
    defaultValues: {
      room_id: '',
      tenant_name: '',
      tenant_phone: '',
      tenant_id_card: '',
      tenant_emergency_contact: '',
      tenant_emergency_phone: '',
      tenant_notes: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: 0,
      deposit: 0,
      water_rate: 0,
      electricity_rate: 0,
      notes: '',
    },
  });

  // 获取公寓列表
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: !!orgId && !isRoomSpecified,
  });

  // 获取房间列表
  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId, selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  // 监听公寓/房间变化获取水电配置
  const currentRoomId = form.watch('room_id');
  const effectiveApartmentId = isRoomSpecified
    ? room?.apartment_id
    : rooms?.find((r) => r.id === currentRoomId)?.apartment_id;

  useEffect(() => {
    if (effectiveApartmentId && open) {
      utilityConfigApi
        .get(orgId, effectiveApartmentId)
        .then(setUtilityConfig)
        .catch(() => {
          setUtilityConfig(null);
        });
    } else {
      setUtilityConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  // 更新水电费率表单默认值
  useEffect(() => {
    if (utilityConfig && open) {
      const waterPrice = utilityConfig.water_price_per_unit ?? 0;
      const elecPrice = utilityConfig.electricity_price_per_unit ?? 0;
      if (form.getValues('water_rate') === 0) {
        form.setValue('water_rate', waterPrice);
      }
      if (form.getValues('electricity_rate') === 0) {
        form.setValue('electricity_rate', elecPrice);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utilityConfig, open]);

  // 初始化/重置表单
  useEffect(() => {
    if (room && open) {
      form.reset({
        room_id: room.id,
        tenant_name: '',
        tenant_phone: '',
        tenant_id_card: '',
        tenant_emergency_contact: '',
        tenant_emergency_phone: '',
        tenant_notes: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: room.monthly_rent,
        deposit: 0,
        water_rate: utilityConfig?.water_price_per_unit ?? 0,
        electricity_rate: utilityConfig?.electricity_price_per_unit ?? 0,
        notes: '',
      });
    } else if (!isRoomSpecified && open) {
      form.reset({
        room_id: '',
        tenant_name: '',
        tenant_phone: '',
        tenant_id_card: '',
        tenant_emergency_contact: '',
        tenant_emergency_phone: '',
        tenant_notes: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: 0,
        deposit: 0,
        water_rate: 0,
        electricity_rate: 0,
        notes: '',
      });
      setSelectedApartmentId(null);
    }
    setFeeItems([]);
  }, [room, open, isRoomSpecified]);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setTenantSearchOpen(false);
    }
  }, [open]);

  // 租客选择回填
  const handleTenantSelect = (tenant: Tenant) => {
    form.setValue('tenant_name', tenant.name || '');
    form.setValue('tenant_phone', tenant.phone || '');
    form.setValue('tenant_id_card', tenant.id_card || '');
    form.setValue('tenant_emergency_contact', tenant.emergency_contact || '');
    form.setValue('tenant_emergency_phone', tenant.emergency_phone || '');
    form.setValue('tenant_notes', tenant.notes || '');
  };

  // 签约提交：先处理租客，再创建租约
  const createMutation = useMutation({
    mutationFn: async (data: LeaseSigningFormData) => {
      let tenantId = '';
      if (data.tenant_id_card) {
        const existingTenants = await tenantsApi.list(orgId, data.tenant_id_card);
        const found = existingTenants.find((t) => t.id_card === data.tenant_id_card);
        if (found) {
          const updated = await tenantsApi.update(orgId, found.id, {
            name: data.tenant_name,
            phone: data.tenant_phone,
            id_card: data.tenant_id_card,
            emergency_contact: data.tenant_emergency_contact,
            emergency_phone: data.tenant_emergency_phone,
            notes: data.tenant_notes,
          });
          tenantId = updated.id;
        } else {
          const created = await tenantsApi.create(orgId, {
            name: data.tenant_name,
            phone: data.tenant_phone,
            id_card: data.tenant_id_card,
            emergency_contact: data.tenant_emergency_contact,
            emergency_phone: data.tenant_emergency_phone,
            notes: data.tenant_notes,
          });
          tenantId = created.id;
        }
      } else {
        const created = await tenantsApi.create(orgId, {
          name: data.tenant_name,
          phone: data.tenant_phone,
          id_card: data.tenant_id_card,
          emergency_contact: data.tenant_emergency_contact,
          emergency_phone: data.tenant_emergency_phone,
          notes: data.tenant_notes,
        });
        tenantId = created.id;
      }

      const leaseData = {
        room_id: data.room_id,
        tenant_id: tenantId,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        monthly_rent: data.monthly_rent,
        deposit: data.deposit,
        water_rate: data.water_rate,
        electricity_rate: data.electricity_rate,
        notes: data.notes,
      };
      // 添加费用项目
      if (feeItems && feeItems.length > 0) {
        (leaseData as Record<string, unknown>).fee_items = feeItems.map((item) => ({
          fee_name: item.name,
          fee_amount: item.amount,
          fee_cycle: item.cycle,
          quantity: 1,
          notes: item.notes || undefined,
        }));
      }
      const lease = await leasesApi.create(orgId, filterEmptyStrings(leaseData));
      return lease;
    },
    onSuccess: (createdLease, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      onOpenChange(false);
      form.reset();
      appToast.success('签约成功');
      const roomId = createdLease.room_id;
      const startDate = createdLease.start_date;
      const isHistoricalEntry = variables.start_date < toDateInputValue(new Date());
      const matchedRoom = room ?? rooms?.find((r) => r.id === variables.room_id);
      const aptName =
        matchedRoom?.apartment?.name ?? apartments?.find((a) => a.id === matchedRoom?.apartment_id)?.name ?? '';
      const roomDisplay = matchedRoom ? `${aptName} - ${matchedRoom.room_number}` : '';
      onLeaseCreated?.({
        room_id: roomId,
        room_display: roomDisplay,
        start_date: startDate,
        is_historical_entry: isHistoricalEntry,
      });
      onSuccess?.();
    },
    onError: (error) => appToast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = (data: LeaseSigningFormData) => {
    createMutation.mutate(data);
  };

  const handleNextStep = async () => {
    const fields = leaseSigningStepFields[currentStep];

    if (!fields.length) {
      setCurrentStep((step) => Math.min(step + 1, leaseSigningSteps.length - 1));
      return;
    }

    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (!isValid) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, leaseSigningSteps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCurrentStep(0);
      setTenantSearchOpen(false);
    }
  };

  const getDialogTitle = () => (isRoomSpecified ? '签约' : '新增租约');
  const getDialogDescription = () => (isRoomSpecified && room ? `为房间 ${room.room_number} 创建租约` : '创建新的租约');

  return (
    <>
      <WizardDrawer
        open={open}
        onOpenChange={handleDrawerOpenChange}
        title={getDialogTitle()}
        description={getDialogDescription()}
        steps={leaseSigningSteps}
        currentStep={currentStep}
        onNext={handleNextStep}
        onPrevious={handlePreviousStep}
        onComplete={() => {
          void form.handleSubmit(handleSubmit)();
        }}
        completeLabel={createMutation.isPending ? '创建中...' : '确认签约'}
        isPending={createMutation.isPending}
        contentTestId="lease-signing-drawer"
        footerExtra={
          currentStep === 2 ? (
            <p className="text-sm text-muted-foreground">
              完成后会自动刷新租约、房间和租客数据。
            </p>
          ) : null
        }
        size="lg"
      >
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
          id="lease-signing-wizard-form"
        >
          {currentStep === 0 ? (
            <RoomInfoSection
              form={form}
              room={room}
              isRoomSpecified={isRoomSpecified}
              apartments={apartments}
              rooms={rooms}
              selectedApartmentId={selectedApartmentId}
              onApartmentChange={setSelectedApartmentId}
            />
          ) : null}

          {currentStep === 1 ? <TenantInfoSection form={form} onSearchTenant={() => setTenantSearchOpen(true)} /> : null}

          {currentStep === 2 ? (
            <ContractInfoSection
              form={form}
              feeItems={feeItems}
              onFeeItemsChange={setFeeItems}
            />
          ) : null}
        </form>
      </WizardDrawer>

      <TenantSearchDrawer
        orgId={orgId}
        open={tenantSearchOpen}
        onOpenChange={setTenantSearchOpen}
        onSelect={handleTenantSelect}
      />
    </>
  );
}
