import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Drawer, Space } from 'antd';
import type { LeaseSigningFormData } from '@/types';
import { leasesApi } from '@/api/leases';
import { apartmentsApi, roomsApi, apartmentConfigApi } from '@/api/apartments';
import { tenantsApi } from '@/api/tenants';
import { toDateInputValue } from '@/utils/date';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@propease/web-shared';
import { TenantSearchDrawer } from './tenant-search-drawer';
import { RoomInfoSection, type RoomInfoSectionRef } from './room-info-section';
import { TenantInfoSection, type TenantInfoSectionRef } from './tenant-info-section';
import { ContractInfoSection, type ContractInfoSectionRef } from './contract-info-section';
import type { FeeItem } from './fee-items-editor';
import type { Room, Tenant, ApartmentConfig } from '@propease/api-contract';

const leaseSigningSteps = [
  { id: 'room', title: '房间', description: '选择公寓与房间' },
  { id: 'tenant', title: '租客', description: '填写租客信息' },
  { id: 'contract', title: '签约确认', description: '设置合同条款' },
] as const;

interface LeaseSigningDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSuccess?: () => void;
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
  const [apartmentConfig, setApartmentConfig] = useState<ApartmentConfig | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [tenantSearchOpen, setTenantSearchOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const roomSectionRef = useRef<RoomInfoSectionRef>(null);
  const tenantSectionRef = useRef<TenantInfoSectionRef>(null);
  const contractSectionRef = useRef<ContractInfoSectionRef>(null);

  // Stores values from each section for final submission
  const [sectionValues, setSectionValues] = useState<Partial<LeaseSigningFormData>>({});

  const isRoomSpecified = !!room;

  // 获取公寓列表
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId && !isRoomSpecified,
  });

  // 获取房间列表
  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  // Listen for apartment/room changes to get utility config
  const currentRoomId = room?.id;
  const effectiveApartmentId = isRoomSpecified
    ? room?.apartment_id
    : rooms?.find((r) => r.id === currentRoomId)?.apartment_id;

  useEffect(() => {
    if (effectiveApartmentId && open) {
      apartmentConfigApi
        .get(effectiveApartmentId)
        .then(setApartmentConfig)
        .catch(() => setApartmentConfig(null));
    } else {
      setApartmentConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  // Pre-fill utility rates when config loads
  useEffect(() => {
    if (apartmentConfig && open) {
      setSectionValues((prev) => ({
        ...prev,
        water_rate: prev.water_rate === undefined ? (apartmentConfig.water_price_per_unit ?? 0) : prev.water_rate,
        electricity_rate: prev.electricity_rate === undefined ? (apartmentConfig.electricity_price_per_unit ?? 0) : prev.electricity_rate,
      }));
    }
  }, [apartmentConfig, open]);

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setSectionValues({
        start_date: new Date().toISOString().split('T')[0],
        monthly_rent: room?.pricing?.monthly_rent ?? 0,
        deposit: 0,
        water_rate: apartmentConfig?.water_price_per_unit ?? 0,
        electricity_rate: apartmentConfig?.electricity_price_per_unit ?? 0,
      });
      setFeeItems([]);
      setCurrentStep(0);
      setSelectedApartmentId(null);
    }
  }, [open, room, apartmentConfig]);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setTenantSearchOpen(false);
    }
  }, [open]);

  // 租客选择回填 - update tenant section values
  const handleTenantSelect = (tenant: Tenant) => {
    setSectionValues((prev) => ({
      ...prev,
      tenant_name: tenant.name || '',
      tenant_phone: tenant.phone || '',
      tenant_id_card: tenant.id_card || '',
      tenant_emergency_contact: tenant.emergency_contact || '',
      tenant_emergency_phone: tenant.emergency_phone || '',
      tenant_notes: tenant.notes || '',
    }));
  };

  // 签约提交：先处理租客，再创建租约
  const createMutation = useMutation({
    mutationFn: async (data: LeaseSigningFormData) => {
      let tenantId = '';
      if (data.tenant_id_card) {
        const existingTenants = await tenantsApi.list(data.tenant_id_card);
        const found = existingTenants.find((t) => t.id_card === data.tenant_id_card);
        if (found) {
          const updated = await tenantsApi.update(found.id, {
            name: data.tenant_name,
            phone: data.tenant_phone,
            id_card: data.tenant_id_card,
            emergency_contact: data.tenant_emergency_contact,
            emergency_phone: data.tenant_emergency_phone,
            notes: data.tenant_notes,
          });
          tenantId = updated.id;
        } else {
          const created = await tenantsApi.create({
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
        const created = await tenantsApi.create({
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
      if (feeItems && feeItems.length > 0) {
        (leaseData as Record<string, unknown>).fee_items = feeItems.map((item) => ({
          fee_name: item.name,
          fee_amount: item.amount,
          fee_cycle: item.cycle,
          quantity: 1,
          notes: item.notes || undefined,
        }));
      }
      const lease = await leasesApi.create(filterEmptyStrings(leaseData));
      return lease;
    },
    onSuccess: (createdLease, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      onOpenChange(false);
      toast.success('签约成功');
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
    onError: (error) => toast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        await roomSectionRef.current?.validate();
        const values = roomSectionRef.current?.getValues() || {};
        setSectionValues((prev) => ({ ...prev, ...values }));
      } else if (currentStep === 1) {
        await tenantSectionRef.current?.validate();
        const values = tenantSectionRef.current?.getValues() || {};
        setSectionValues((prev) => ({ ...prev, ...values }));
      }
      setCurrentStep((step) => Math.min(step + 1, leaseSigningSteps.length - 1));
    } catch {
      // Validation failed
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      await contractSectionRef.current?.validate();
      const contractValues = contractSectionRef.current?.getValues() || {};
      const allValues = { ...sectionValues, ...contractValues } as LeaseSigningFormData;
      createMutation.mutate(allValues);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCurrentStep(0);
      setTenantSearchOpen(false);
    }
  };

  const getDialogTitle = () => (isRoomSpecified ? '房间签约' : '新建租约');
  const getDialogDescription = () =>
    isRoomSpecified && room ? `为 ${room.apartment?.name || ''} - ${room.room_number} 创建租约` : '按步骤填写信息以创建新租约';

  return (
    <>
      <Drawer
        open={open}
        onClose={() => handleDrawerOpenChange(false)}
        title={
          <div className="text-left">
            <div className="text-lg font-semibold">{getDialogTitle()}</div>
            <div className="text-sm text-muted-foreground font-normal">{getDialogDescription()}</div>
          </div>
        }
        footer={
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button type="default" onClick={handlePreviousStep}>
                上一步
              </Button>
            )}
            {currentStep < leaseSigningSteps.length - 1 && (
              <Button type="primary" onClick={handleNextStep}>
                下一步
              </Button>
            )}
            {currentStep === leaseSigningSteps.length - 1 && (
              <Button type="primary" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? '签约中...' : '确认签约'}
              </Button>
            )}
          </div>
        }
        placement="right"
        style={{ width: '100%', maxWidth: 640 }}
      >
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {leaseSigningSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-sm ${
                  index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span>{step.title}</span>
                {index < leaseSigningSteps.length - 1 && (
                  <span className="mx-1 text-muted-foreground">/</span>
                )}
              </div>
            ))}
          </div>

          {currentStep === 2 && (
            <p className="mb-4 text-sm text-muted-foreground">签约完成后将自动刷新数据</p>
          )}

          <div className="space-y-6">
            {currentStep === 0 && (
              <RoomInfoSection
                ref={roomSectionRef}
                room={room}
                isRoomSpecified={isRoomSpecified}
                apartments={apartments}
                rooms={rooms}
                selectedApartmentId={selectedApartmentId}
                onApartmentChange={setSelectedApartmentId}
              />
            )}

            {currentStep === 1 && (
              <TenantInfoSection
                ref={tenantSectionRef}
                onSearchTenant={() => setTenantSearchOpen(true)}
              />
            )}

            {currentStep === 2 && (
              <ContractInfoSection
                ref={contractSectionRef}
                feeItems={feeItems}
                onFeeItemsChange={setFeeItems}
                initialValues={sectionValues}
              />
            )}
          </div>
        </div>
      </Drawer>

      <TenantSearchDrawer
        orgId={orgId}
        open={tenantSearchOpen}
        onOpenChange={setTenantSearchOpen}
        onSelect={handleTenantSelect}
      />
    </>
  );
}
