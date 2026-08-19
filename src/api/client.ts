const BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? '/api'
).replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * 统一的 HTTP 请求封装：拼接 base URL、附带 JSON 头、归一化错误信息。
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `请求失败 (${response.status})`
    try {
      const body = await response.json()
      if (Array.isArray(body.message)) {
        message = body.message.join('；')
      } else if (typeof body.message === 'string' && body.message) {
        message = body.message
      }
    } catch {
      // 非 JSON 响应，保留默认错误信息
    }
    throw new ApiError(response.status, message)
  }

  return (await response.json()) as T
}
