/** 共享类型 — 前后端统一 */
export type { Pagination } from './common.js';

/** 通用契约 */
export type {
  SuccessBody,
  ErrorResponseBody,
  ErrorResponseData,
  FieldError,
  PaginatedResponse,
} from './common.js';
export { BusinessCode } from './common.js';

/** 认证与用户 */
export type {
  User,
  LoginCredentials,
  RegisterData,
  TokenResponse,
} from './auth.js';

/** 组织 */
export type {
  BrandConfig,
  PublicConfig,
} from './config.js';

/** 组织 */
export type {
  MemberRole,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  MigrationStats,
  DeletionPreview,
  OrganizationMember,
  OrganizationUsage,
} from './organizations.js';

/** 订阅 */
export type {
  SubscriptionPlan,
  OrganizationSubscription,
  SubscribeRequest,
  SubscriptionStatus,
  SubscriptionOrderStatus,
  SubscriptionOrder,
  SubscriptionOrderCreate,
  UsageQuotaItem,
  OrganizationUsageStats,
} from './subscriptions.js';

/** 优惠活动 */
export type {
  PromotionType,
  DiscountType,
  PlanPricing,
  PromotionPlan,
  Promotion,
  PromotionCreate,
  PromotionUpdate,
  PromotionListParams,
  PromotionCalculation,
} from './promotion.js';

/** 服务定价模块 */
export type {
  PricingDiscount,
  ServiceProduct,
  ServicePricing,
  ServiceProductCreate,
  ServiceProductUpdate,
  ServicePricingCreate,
  ServicePricingBatchUpdate,
  StorefrontConfig,
  StorefrontItem,
  StorefrontConfigCreate,
  StorefrontConfigUpdate,
  StorefrontItemCreate,
  StorefrontItemUpdate,
  StorefrontItemsReorder,
  StorefrontViewService,
  StorefrontViewPricing,
  StorefrontView,
} from './service-product.js';

/** 公寓与房间 */
export type {
  Apartment,
  ApartmentCreate,
  ApartmentUpdate,
  ApartmentFormData,
  RoomStats,
  ApartmentWithStats,
  RoomStatus,
  FacilityItem,
  RoomFacilities,
  FacilityPreset,
  Room,
  RoomCreate,
  RoomUpdate,
  RoomEdit,
  RoomBatchCreate,
  RoomFormData,
  RoomEditFormData,
  UtilityConfig,
  UtilityConfigCreate,
  UtilityConfigUpdate,
} from './apartments.js';

/** 租客 */
export type { Tenant, TenantCreate, TenantUpdate, TenantFormData, TenantListParams } from './tenants.js';

/** 租约 */
export type { Lease, LeaseCreate, LeaseUpdate, LeaseListParams, LeaseFeeItem } from './leases.js';

/** 水电读数 */
export type {
  UtilityReading,
  UtilityReadingCreate,
  UtilityReadingUpdate,
  UtilityListParams,
  BatchUtilityReadingItem,
  BatchUtilityReadingData,
  RoomMissingInitialReading,
  UtilityExportRoom,
} from './utilities.js';

/** 按量购买 */
export type {
  UsagePricing,
  UsageQuota,
  UsageQuotaOrder,
} from './usage.js';

/** 通知 */
export type {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationExtraData,
  NotificationChannelName,
  NotificationChannelStatus,
  TenantReachabilityChannel,
  TenantReachabilityEventType,
  NotificationDeliveryStatus,
  TenantNotificationTemplate,
  TenantNotificationDelivery,
  UnreadCountResponse,
} from './notifications.js';

/** 账单与支付 */
export type {
  BillStatus,
  PaymentMethod,
  Bill,
  BillCreate,
  BillUpdate,
  BillListParams,
  GenerateBillsRequest,
  GenerateBillsResult,
  Payment,
  PaymentCreate,
} from './bills.js';

/** 费用类型与配置 */
export type {
  FeeCycle,
  FeeCategory,
  OrgFeeItem,
  OrgFeeItemCreate,
  OrgFeeItemUpdate,
} from './feeTypes.js';

/** 费用类型兼容层（向后兼容） */
export type {
  FeeType,
  FeeSpecification,
  FeeTypeCreate,
  FeeTypeUpdate,
  FeeSpecificationCreate,
  FeeSpecificationUpdate,
  ApartmentFeeConfig,
  ApartmentFeeConfigCreate,
  ApartmentFeeConfigUpdate,
  BillFeeItem,
} from './feeTypes.compat.js';
export { orgFeeItemToFeeType } from './feeTypes.compat.js';

/** 报表 */
export type {
  DashboardOverview,
  IncomeReport,
  IncomeReportParams,
  OccupancyReport,
  OccupancyReportParams,
  ReportMetadata,
} from './reports.js';

/** 权限类型 */
export type {
  Resource,
  Action,
  Permission,
  RolePermissions,
  UpdateRolePermissionsRequest,
  UserPermissionsResponse,
  SystemRole,
  SystemRoleConfig,
} from './permissions.js';

/** 权限常量 */
export {
  RESOURCES,
  ACTIONS,
  RESOURCE_NAMES,
  ACTION_NAMES,
  toPermissionCodes,
} from './permissions.js';

/** 运营后台 */
export type {
  AdminTokenResponse,
  AdminPlatformStats,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  AdminPasswordReset,
  AdminOrganization,
  AdminOrganizationSetActive,
  AdminRegisteredUserOrg,
  AdminRegisteredUser,
  AdminRegisteredUserDetail,
  AdminRegisteredUserSetActive,
  AdminPlanPricingCreate,
  AdminPlan,
  AdminPlanCreate,
  AdminPlanUpdate,
  AdminPlanPricingUpdate,
  AdminSubscription,
  AdminSubscriptionRenew,
  AdminSubscriptionGiftCreate,
  AdminPlatformConfig,
  AdminUsagePricing,
  AdminUsagePricingUpdate,
} from './admin.js';

/** 用量付费（统一订单） */
export type {
  BillingOrder,
  BillingOrderType,
  BillingOrderStatus,
  BillingUsageDetails,
  CreateSubscriptionOrderRequest,
  CreateUsageOrderRequest,
  CreateBillingOrderRequest,
  BillingOrderListParams,
  BillingOrderListResponse,
  UsageUnitPricing,
  AdminUsagePricingResponse,
  AdminUsagePricingUpdateRequest,
} from './billing.js';
