import { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api/client';

/**
 * 过滤对象中的空字符串，避免后端验证错误
 * 将空字符串 '' 转换为 undefined（从对象中移除）
 */
export function filterEmptyStrings<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '')
  ) as Partial<T>;
}

/**
 * 将 API 字段错误转换为表单错误格式
 * 用于在提交失败时显示后端验证错误
 *
 * @example
 * ```tsx
 * const form = useForm<FormValues>();
 *
 * const mutation = useMutation({
 *   mutationFn: (data) => apartmentsApi.create(orgId, data),
 *   onError: (error) => {
 *     setFormErrors(form.setError, error);
 *   },
 * });
 * ```
 */
export function setFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
): void {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    error.fieldErrors.forEach((fieldError) => {
      const fieldName = fieldError.field.replace(/^body\./, '') as FieldPath<T>;
      setError(fieldName, {
        type: 'server',
        message: fieldError.message,
      });
    });
  }
}

/**
 * 从 API 错误中提取字段错误映射
 * 用于手动显示字段级错误
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    return Object.fromEntries(
      error.fieldErrors.map((e) => [
        e.field.replace(/^body\./, ''),
        e.message,
      ])
    );
  }
  return {};
}
