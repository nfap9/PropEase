const zhHansNaturalCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
});

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}

function compareNullable<T>(left: T | null | undefined, right: T | null | undefined): number {
  const hasLeft = left != null;
  const hasRight = right != null;

  if (!hasLeft && !hasRight) return 0;
  if (!hasLeft) return 1;
  if (!hasRight) return -1;
  return 0;
}

function toTimestamp(value?: Date | string | null): number | null {
  if (value == null) return null;
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function compareNaturalText(left?: string | null, right?: string | null): number {
  const nullable = compareNullable(left, right);
  if (nullable !== 0) return nullable;
  return zhHansNaturalCollator.compare(normalizeText(left), normalizeText(right));
}

export function compareNumberAsc(
  left?: number | null,
  right?: number | null
): number {
  const nullable = compareNullable(left, right);
  if (nullable !== 0) return nullable;
  return (left as number) - (right as number);
}

export function compareNumberDesc(
  left?: number | null,
  right?: number | null
): number {
  const nullable = compareNullable(left, right);
  if (nullable !== 0) return nullable;
  return (right as number) - (left as number);
}

export function compareDateAsc(
  left?: Date | string | null,
  right?: Date | string | null
): number {
  const leftTime = toTimestamp(left);
  const rightTime = toTimestamp(right);
  const nullable = compareNullable(leftTime, rightTime);
  if (nullable !== 0) return nullable;
  return (leftTime as number) - (rightTime as number);
}

export function compareDateDesc(
  left?: Date | string | null,
  right?: Date | string | null
): number {
  const leftTime = toTimestamp(left);
  const rightTime = toTimestamp(right);
  const nullable = compareNullable(leftTime, rightTime);
  if (nullable !== 0) return nullable;
  return (rightTime as number) - (leftTime as number);
}

export function compareBooleanDesc(
  left?: boolean | null,
  right?: boolean | null
): number {
  const nullable = compareNullable(left, right);
  if (nullable !== 0) return nullable;
  if (left === right) return 0;
  return left ? -1 : 1;
}
