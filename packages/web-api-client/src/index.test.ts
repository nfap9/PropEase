import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import {
  ApiError,
  createApiClient,
  extractFieldErrors,
  filterEmptyStrings,
  getErrorMessage,
} from './index';

function createAxiosConfig(url: string): InternalAxiosRequestConfig {
  return {
    url,
    headers: {},
    method: 'get',
  } as InternalAxiosRequestConfig;
}

function createAxiosResponse(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return {
    config,
    data,
    headers: {},
    status,
    statusText: status === 200 ? 'OK' : 'Error',
  };
}

describe('web-api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('unwraps unified success payload', async () => {
    const api = createApiClient({ baseURL: 'http://example.test' });
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) =>
      createAxiosResponse(config, {
        code: 0,
        data: { ok: true },
        message: 'ok',
      });

    const response = await api.get<{ ok: boolean }>('/ping');

    expect(response.data).toEqual({ ok: true });
  });

  it('maps API error payload to ApiError', async () => {
    const api = createApiClient({ baseURL: 'http://example.test' });
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        config as AxiosRequestConfig,
        null,
        createAxiosResponse(config, {
          code: 40001,
          message: '参数校验失败',
          data: {
            errors: [{ field: 'body.name', message: '必填' }],
          },
        }, 422)
      );
    };

    await expect(api.get('/broken')).rejects.toBeInstanceOf(ApiError);
    await expect(api.get('/broken')).rejects.toMatchObject({
      message: '参数校验失败',
    });
  });

  it('refreshes token on 401 and retries request', async () => {
    const tokenStorage = {
      getAccessToken: vi.fn(() => 'old-access'),
      getRefreshToken: vi.fn(() => 'old-refresh'),
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    };
    const refreshTokens = vi.fn(async () => ({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    }));
    const api = createApiClient({
      baseURL: 'http://example.test',
      tokenStorage,
      refreshTokens,
    });
    let callCount = 0;

    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      callCount += 1;
      if (callCount === 1) {
        throw new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config as AxiosRequestConfig,
          null,
          createAxiosResponse(config, { message: '未授权' }, 401)
        );
      }

      return createAxiosResponse(config, {
        code: 0,
        data: { ok: true },
        message: 'ok',
      });
    };

    const response = await api.get<{ ok: boolean }>('/secure');

    expect(refreshTokens).toHaveBeenCalledWith('old-refresh');
    expect(tokenStorage.setTokens).toHaveBeenCalledWith({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });
    expect(response.data).toEqual({ ok: true });
  });

  it('shares common error helpers', () => {
    const apiError = new ApiError(422, '失败', {
      errors: [{ field: 'body.phone', message: '格式错误' }],
    });

    expect(getErrorMessage(apiError)).toBe('失败');
    expect(extractFieldErrors(apiError)).toEqual({ phone: '格式错误' });
    expect(filterEmptyStrings({ a: 'ok', b: '' })).toEqual({ a: 'ok' });
  });
});
