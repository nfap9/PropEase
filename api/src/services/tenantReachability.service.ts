import type { Prisma } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { ulid } from 'ulid';

export type TenantReachabilityChannel = 'sms';
export type TenantReachabilityEventType = 'bill_generated' | 'rent_due_reminder' | 'bill_overdue';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';

export interface TenantNotificationTemplateView {
  id: string | null;
  organization_id: string;
  channel: TenantReachabilityChannel;
  event_type: TenantReachabilityEventType;
  name: string;
  content: string;
  is_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TenantNotificationDeliveryView {
  id: string;
  organization_id: string;
  tenant_id: string | null;
  tenant_name: string | null;
  lease_id: string | null;
  bill_id: string | null;
  template_id: string | null;
  template_name: string | null;
  channel: TenantReachabilityChannel;
  event_type: TenantReachabilityEventType;
  recipient: string | null;
  status: NotificationDeliveryStatus;
  content: string;
  provider_message_id: string | null;
  status_reason: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
  extra_data: Record<string, unknown> | null;
}

export interface TenantNotificationDeliveryListOptions {
  status?: NotificationDeliveryStatus | 'all';
  event_type?: TenantReachabilityEventType | 'all';
  tenant_id?: string;
  limit?: number;
}

export interface UpdateTenantNotificationTemplateInput {
  content: string;
  is_enabled: boolean;
}

export interface SmsGatewayInput {
  organizationId: string;
  tenantId: string;
  tenantName: string;
  phone: string;
  eventType: TenantReachabilityEventType;
  content: string;
  extraData: Record<string, unknown>;
}

export interface SmsGatewayResult {
  messageId?: string;
}

export interface SmsGateway {
  send(input: SmsGatewayInput): Promise<SmsGatewayResult>;
}

export interface TenantReachabilityService {
  listTemplates(orgId: string): Promise<TenantNotificationTemplateView[]>;
  updateTemplate(
    orgId: string,
    eventType: TenantReachabilityEventType,
    input: UpdateTenantNotificationTemplateInput
  ): Promise<TenantNotificationTemplateView>;
  listDeliveries(
    orgId: string,
    options?: TenantNotificationDeliveryListOptions
  ): Promise<TenantNotificationDeliveryView[]>;
  sendBillGenerated(billId: string): Promise<void>;
  sendRentDueReminder(billId: string): Promise<void>;
  sendBillOverdue(billId: string): Promise<void>;
}

type TemplateDefinition = {
  name: string;
  content: string;
};

type DeliveryExtraData = Record<string, string | number | boolean | null>;

type BillNotificationContext = {
  id: string;
  lease_id: string;
  due_date: Date;
  bill_year: number;
  bill_month: number;
  total_amount: Prisma.Decimal;
  lease: {
    tenant_id: string;
    tenant: {
      name: string;
      phone: string | null;
      sms_opt_out: boolean;
    };
    room: {
      room_number: string;
      apartment: {
        organization_id: string;
        organization: {
          name: string;
        };
      };
    };
  };
};

const TENANT_NOTIFICATION_CHANNEL: TenantReachabilityChannel = 'sms';

const DEFAULT_SMS_TEMPLATES: Record<TenantReachabilityEventType, TemplateDefinition> = {
  bill_generated: {
    name: '账单生成通知',
    content:
      '【{{organization_name}}】{{tenant_name}}您好，{{bill_period}}账单已生成，房间{{room_number}}应缴 ¥{{amount}}，请于 {{due_date}} 前完成支付。回复TD可登记退订。',
  },
  rent_due_reminder: {
    name: '交租日前提醒',
    content:
      '【{{organization_name}}】{{tenant_name}}您好，房间{{room_number}}的 {{bill_period}} 账单将于 {{due_date}} 到期，应缴 ¥{{amount}}。请提前安排付款，避免逾期。',
  },
  bill_overdue: {
    name: '账单逾期催缴',
    content:
      '【{{organization_name}}】{{tenant_name}}您好，房间{{room_number}}的 {{bill_period}} 账单已逾期 {{days_overdue}} 天，当前待缴 ¥{{amount}}。如已支付请忽略，未支付请尽快处理。',
  },
};

function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, rawKey: string) => {
    const value = variables[rawKey];
    return value == null ? '' : String(value);
  });
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDaysDiff(base: Date, target: Date): number {
  const baseDate = new Date(base);
  baseDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(target);
  targetDate.setHours(0, 0, 0, 0);
  return Math.floor((targetDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
}

function createSmsGateway(): SmsGateway {
  return {
    async send(input) {
      if (!config.smsWebhookUrl) {
        throw new Error('短信通道未配置 Webhook 地址');
      }

      const response = await fetch(config.smsWebhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(config.smsWebhookToken
            ? { authorization: `Bearer ${config.smsWebhookToken}` }
            : {}),
        },
        body: JSON.stringify({
          channel: TENANT_NOTIFICATION_CHANNEL,
          sign: config.smsSenderSign,
          organization_id: input.organizationId,
          tenant_id: input.tenantId,
          tenant_name: input.tenantName,
          phone: input.phone,
          event_type: input.eventType,
          content: input.content,
          extra_data: input.extraData,
        }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'message' in payload &&
          typeof payload.message === 'string'
            ? payload.message
            : `短信网关调用失败 (${response.status})`;
        throw new Error(message);
      }

      const messageId =
        payload &&
        typeof payload === 'object' &&
        'message_id' in payload &&
        typeof payload.message_id === 'string'
          ? payload.message_id
          : payload &&
              typeof payload === 'object' &&
              'id' in payload &&
              typeof payload.id === 'string'
            ? payload.id
            : undefined;

      return { messageId };
    },
  };
}

function buildTemplateView(
  orgId: string,
  eventType: TenantReachabilityEventType,
  template?: {
    id: string;
    name: string;
    content: string;
    is_enabled: boolean;
    created_at: Date;
    updated_at: Date;
  } | null
): TenantNotificationTemplateView {
  const defaultTemplate = DEFAULT_SMS_TEMPLATES[eventType];
  return {
    id: template?.id ?? null,
    organization_id: orgId,
    channel: TENANT_NOTIFICATION_CHANNEL,
    event_type: eventType,
    name: template?.name ?? defaultTemplate.name,
    content: template?.content ?? defaultTemplate.content,
    is_enabled: template?.is_enabled ?? true,
    created_at: template?.created_at.toISOString() ?? null,
    updated_at: template?.updated_at.toISOString() ?? null,
  };
}

function normalizeExtraData(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function buildDeliveryView(delivery: {
  id: string;
  organization_id: string;
  tenant_id: string | null;
  lease_id: string | null;
  bill_id: string | null;
  template_id: string | null;
  channel: string;
  event_type: string;
  recipient: string | null;
  status: string;
  content: string;
  provider_message_id: string | null;
  status_reason: string | null;
  created_at: Date;
  updated_at: Date;
  extra_data: unknown;
  tenant?: { name: string } | null;
  lease?: { room: { room_number: string } } | null;
  template?: { name: string } | null;
}): TenantNotificationDeliveryView {
  return {
    id: delivery.id,
    organization_id: delivery.organization_id,
    tenant_id: delivery.tenant_id,
    tenant_name: delivery.tenant?.name ?? null,
    lease_id: delivery.lease_id,
    bill_id: delivery.bill_id,
    template_id: delivery.template_id,
    template_name: delivery.template?.name ?? null,
    channel: TENANT_NOTIFICATION_CHANNEL,
    event_type: delivery.event_type as TenantReachabilityEventType,
    recipient: delivery.recipient,
    status: delivery.status as NotificationDeliveryStatus,
    content: delivery.content,
    provider_message_id: delivery.provider_message_id,
    status_reason: delivery.status_reason,
    room_number: delivery.lease?.room.room_number ?? null,
    created_at: delivery.created_at.toISOString(),
    updated_at: delivery.updated_at.toISOString(),
    extra_data: normalizeExtraData(delivery.extra_data),
  };
}

function getSmsSkipReason(record: BillNotificationContext): string | null {
  const tenant = record.lease.tenant;
  if (!tenant.phone) {
    return '租客缺少手机号，已跳过短信发送';
  }
  if (tenant.sms_opt_out) {
    return '租客已退订短信通知';
  }
  if (!config.smsNotificationsEnabled) {
    return '短信通道未启用';
  }
  return null;
}

function getTemplateVariables(
  eventType: TenantReachabilityEventType,
  record: BillNotificationContext,
  now: Date
): Record<string, string | number> {
  const dueDate = formatDate(record.due_date);
  const daysOverdue = Math.max(1, Math.abs(getDaysDiff(now, record.due_date)));
  const daysUntilDue = Math.max(0, getDaysDiff(now, record.due_date));

  return {
    organization_name: record.lease.room.apartment.organization.name,
    tenant_name: record.lease.tenant.name,
    room_number: record.lease.room.room_number,
    bill_period: `${record.bill_year}年${record.bill_month}月`,
    amount: formatMoney(Number(record.total_amount)),
    due_date: dueDate,
    days_overdue: eventType === 'bill_overdue' ? daysOverdue : '',
    days_until_due: eventType === 'rent_due_reminder' ? daysUntilDue : '',
  };
}

export function createTenantReachabilityService(
  {
    db = prisma,
    smsGateway = createSmsGateway(),
    now = () => new Date(),
    logger = console,
  }: {
    db?: DbClient;
    smsGateway?: SmsGateway;
    now?: () => Date;
    logger?: Pick<Console, 'error'>;
  } = {}
): TenantReachabilityService {
    const getBillNotificationRecord = async (billId: string): Promise<BillNotificationContext | null> => {
    return db.bill.findUnique({
      where: { id: billId },
      include: {
        lease: {
          include: {
            tenant: true,
            room: {
              include: {
                apartment: {
                  include: {
                    organization: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  const getTemplate = async (orgId: string, eventType: TenantReachabilityEventType) => {
    const template = await db.notificationTemplate.findUnique({
      where: {
        organization_id_channel_event_type: {
          organization_id: orgId,
          channel: TENANT_NOTIFICATION_CHANNEL,
          event_type: eventType,
        },
      },
    });

    return {
      template,
      view: buildTemplateView(orgId, eventType, template),
    };
  };

  const createDelivery = async (input: {
    organizationId: string;
    tenantId: string | null;
    leaseId: string | null;
    billId: string | null;
    templateId: string | null;
    eventType: TenantReachabilityEventType;
    recipient: string | null;
    status: NotificationDeliveryStatus;
    content: string;
    providerMessageId?: string;
    statusReason?: string | null;
    extraData?: DeliveryExtraData;
  }) => {
    const delivery = await db.notificationDelivery.create({
      data: {
        id: ulid().toLowerCase(),
        organization_id: input.organizationId,
        tenant_id: input.tenantId,
        lease_id: input.leaseId,
        bill_id: input.billId,
        template_id: input.templateId,
        channel: TENANT_NOTIFICATION_CHANNEL,
        event_type: input.eventType,
        recipient: input.recipient,
        status: input.status,
        content: input.content,
        provider_message_id: input.providerMessageId,
        status_reason: input.statusReason ?? null,
        extra_data: input.extraData as Prisma.InputJsonValue | undefined,
      },
      include: {
        tenant: true,
        lease: { include: { room: true } },
        template: true,
      },
    });

    return buildDeliveryView(delivery);
  };

  const sendEventForBill = async (eventType: TenantReachabilityEventType, billId: string) => {
    const record = await getBillNotificationRecord(billId);
    if (!record) {
      return;
    }

    const organizationId = record.lease.room.apartment.organization_id;
    const { template, view } = await getTemplate(organizationId, eventType);
    const templateVariables = getTemplateVariables(eventType, record, now());
    const content = renderTemplate(view.content, templateVariables);
    const extraData: DeliveryExtraData = {
      bill_id: record.id,
      lease_id: record.lease_id,
      due_date: formatDate(record.due_date),
      bill_year: record.bill_year,
      bill_month: record.bill_month,
    };

    if (!view.is_enabled) {
      await createDelivery({
        organizationId,
        tenantId: record.lease.tenant_id,
        leaseId: record.lease_id,
        billId: record.id,
        templateId: template?.id ?? null,
        eventType,
        recipient: record.lease.tenant.phone,
        status: 'skipped',
        content,
        statusReason: '短信模板已停用',
        extraData,
      });
      return;
    }

    const skipReason = getSmsSkipReason(record);
    if (skipReason) {
      await createDelivery({
        organizationId,
        tenantId: record.lease.tenant_id,
        leaseId: record.lease_id,
        billId: record.id,
        templateId: template?.id ?? null,
        eventType,
        recipient: record.lease.tenant.phone,
        status: 'skipped',
        content,
        statusReason: skipReason,
        extraData,
      });
      return;
    }

    try {
      const result = await smsGateway.send({
        organizationId,
        tenantId: record.lease.tenant_id,
        tenantName: record.lease.tenant.name,
        phone: record.lease.tenant.phone!,
        eventType,
        content,
        extraData,
      });

      await createDelivery({
        organizationId,
        tenantId: record.lease.tenant_id,
        leaseId: record.lease_id,
        billId: record.id,
        templateId: template?.id ?? null,
        eventType,
        recipient: record.lease.tenant.phone,
        status: 'sent',
        content,
        providerMessageId: result.messageId,
        extraData,
      });
    } catch (error) {
      logger.error('[tenantReachability] sms send failed:', error);
      const message = error instanceof Error ? error.message : '短信发送失败';
      await createDelivery({
        organizationId,
        tenantId: record.lease.tenant_id,
        leaseId: record.lease_id,
        billId: record.id,
        templateId: template?.id ?? null,
        eventType,
        recipient: record.lease.tenant.phone,
        status: 'failed',
        content,
        statusReason: message,
        extraData,
      });
    }
  };

  return {
    async listTemplates(orgId) {
      const templates = await db.notificationTemplate.findMany({
        where: {
          organization_id: orgId,
          channel: TENANT_NOTIFICATION_CHANNEL,
        },
      });
      const templateByEvent = new Map(templates.map((item) => [item.event_type, item]));

      return (Object.keys(DEFAULT_SMS_TEMPLATES) as TenantReachabilityEventType[]).map((eventType) =>
        buildTemplateView(orgId, eventType, templateByEvent.get(eventType) ?? null)
      );
    },

    async updateTemplate(orgId, eventType, input) {
      const template = await db.notificationTemplate.upsert({
        where: {
          organization_id_channel_event_type: {
            organization_id: orgId,
            channel: TENANT_NOTIFICATION_CHANNEL,
            event_type: eventType,
          },
        },
        update: {
          name: DEFAULT_SMS_TEMPLATES[eventType].name,
          content: input.content,
          is_enabled: input.is_enabled,
        },
        create: {
          id: ulid().toLowerCase(),
          organization_id: orgId,
          channel: TENANT_NOTIFICATION_CHANNEL,
          event_type: eventType,
          name: DEFAULT_SMS_TEMPLATES[eventType].name,
          content: input.content,
          is_enabled: input.is_enabled,
        },
      });

      return buildTemplateView(orgId, eventType, template);
    },

    async listDeliveries(orgId, options = {}) {
      const where: Record<string, unknown> = {
        organization_id: orgId,
        channel: TENANT_NOTIFICATION_CHANNEL,
      };

      if (options.status && options.status !== 'all') {
        where.status = options.status;
      }
      if (options.event_type && options.event_type !== 'all') {
        where.event_type = options.event_type;
      }
      if (options.tenant_id) {
        where.tenant_id = options.tenant_id;
      }

      const deliveries = await db.notificationDelivery.findMany({
        where,
        include: {
          tenant: true,
          lease: { include: { room: true } },
          template: true,
        },
        orderBy: { created_at: 'desc' },
        take: options.limit ?? 50,
      });

      return deliveries.map((item) => buildDeliveryView(item));
    },

    async sendBillGenerated(billId) {
      if (typeof db.bill.findUnique !== 'function') {
        return;
      }
      await sendEventForBill('bill_generated', billId);
    },

    async sendRentDueReminder(billId) {
      if (typeof db.bill.findUnique !== 'function') {
        return;
      }
      await sendEventForBill('rent_due_reminder', billId);
    },

    async sendBillOverdue(billId) {
      if (typeof db.bill.findUnique !== 'function') {
        return;
      }
      await sendEventForBill('bill_overdue', billId);
    },
  };
}

export const defaultTenantReachabilityService = createTenantReachabilityService();

export { DEFAULT_SMS_TEMPLATES, TENANT_NOTIFICATION_CHANNEL, renderTemplate };
