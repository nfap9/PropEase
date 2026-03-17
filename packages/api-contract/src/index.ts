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
  MemberRole,
  Organization,
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
  PriceCalculationRequest,
  PriceCalculationResult,
} from './service-product.js';

/** 公寓与房间 */
export type {
  Apartment,
  RoomStats,
  ApartmentWithStats,
  RoomStatus,
  Room,
  RoomBatchCreate,
  UtilityConfig,
  UtilityConfigCreate,
  UtilityConfigUpdate,
  FacilityItem,
  RoomFacilities,
  FacilityPreset,
} from './apartments.js';

/** 租客 */
export type { Tenant } from './tenants.js';

/** 租约 */
export type { Lease } from './leases.js';

/** 水电读数 */
export type { UtilityReading } from './utilities.js';

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
  Payment,
} from './bills.js';

/** 费用类型与配置 */
export type {
  FeeCategory,
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
} from './feeTypes.js';

/** 报表 */
export type {
  DashboardOverview,
  IncomeReport,
  OccupancyReport,
} from './reports.js';

/** 权限 */
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

/** 运营后台 */
export type {
  AdminTokenResponse,
  AdminPlatformStats,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  AdminPasswordReset,
  AdminRole,
  AdminRoleCreate,
  AdminRoleUpdate,
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
