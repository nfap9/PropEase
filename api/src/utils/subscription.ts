export interface ActiveSubscriptionLike {
  status: string;
  end_date: Date | null;
}

/**
 * 判断订阅是否有效：status=active 且 end_date 为空或 >= 今天
 */
export function isSubscriptionActive(
  sub: ActiveSubscriptionLike | null | undefined
): boolean {
  if (!sub || sub.status !== 'active') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!sub.end_date) return true;

  const end = new Date(sub.end_date);
  end.setHours(0, 0, 0, 0);
  return end >= today;
}
