import Taro from '@tarojs/taro'

const API_URL = process.env.TARO_APP_API_URL || 'http://localhost:8000/api/v1'

interface RequestOptions extends Taro.request.Option {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
}

interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
}

const request = <T = any>(options: RequestOptions): Promise<T> => {
  const token = Taro.getStorageSync('access_token')

  const defaultOptions: Taro.request.Option = {
    url: `${API_URL}${options.url}`,
    method: options.method || 'GET',
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
    data: options.data,
    timeout: 15000,
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      ...defaultOptions,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          Taro.removeStorageSync('access_token')
          Taro.removeStorageSync('user')
          Taro.reLaunch({ url: '/pages/login/index' })
          reject(new Error('Unauthorized'))
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

export const api = {
  get: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'GET', data, ...options }),

  post: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'POST', data, ...options }),

  put: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PUT', data, ...options }),

  delete: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'DELETE', data, ...options }),

  patch: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PATCH', data, ...options }),
}

export default api
