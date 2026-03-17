import {
  ApiError,
  createBrowserApiClient,
  type ApiResponse,
  type FieldError,
} from '@apartment-ultra/web-api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type { ApiResponse, FieldError };
export { ApiError };

export const api = createBrowserApiClient({
  baseURL: API_URL,
});

export default api;
