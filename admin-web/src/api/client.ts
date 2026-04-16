import {
  ApiError,
  createBrowserApiClient,
  type ApiResponse,
  type FieldError,
} from '@apartment-ultra/web-api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export type { ApiResponse, FieldError };
export { ApiError };

export const api = createBrowserApiClient({
  baseURL: API_URL,
  defaultHeaders: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

export default api;
