export type FilterActive = 'all' | 'active' | 'inactive';

export type GiftSubscriptionForm = {
  organization_id: string;
  service_id: string;
  pricing_id: string;
  gift_months: number;
};
