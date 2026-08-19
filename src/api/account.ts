import { request } from './client'

export interface AccountItem {
  id: string
  name: string
  type: string
  layer: string
  skill: string
  persona: string | null
  xHandle: string | null
  takesAllEvents: boolean
  status: string
}

/** 获取运营账号列表，可按类型筛选（不传或传「全部」返回所有） */
export function getAccounts(type?: string): Promise<AccountItem[]> {
  const query = type && type !== '全部' ? `?type=${encodeURIComponent(type)}` : ''
  return request<AccountItem[]>(`/account${query}`)
}

/** 获取所有账号类型（供筛选下拉） */
export function getAccountTypes(): Promise<string[]> {
  return request<string[]>('/account/types')
}
