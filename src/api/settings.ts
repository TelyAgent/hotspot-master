import { request } from './client'

/** 各分区类型化行：公共字段 + 各分区专列（keywords、positiveExamples …） */
export interface SettingItem {
  id: string
  name: string
  description: string | null
  enabled: boolean
  fields: Record<string, string> | null
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export interface SettingAudit {
  id: string
  object: string
  action: string
  operator: string
  version: string
  reason: string | null
  createdAt: string
}

export interface SettingPayload {
  name?: string
  description?: string
  enabled?: boolean
  fields?: Record<string, string>
}

export function getSettings(category: string): Promise<SettingItem[]> {
  return request(`/settings/${category}`)
}

export function getAudit(): Promise<SettingAudit[]> {
  return request('/settings/audit')
}

export function createSetting(
  category: string,
  data: SettingPayload & { name: string },
): Promise<SettingItem> {
  return request(`/settings/${category}`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateSetting(
  category: string,
  id: string,
  data: SettingPayload,
): Promise<SettingItem> {
  return request(`/settings/${category}/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteSetting(category: string, id: string): Promise<SettingItem> {
  return request(`/settings/${category}/${id}`, { method: 'DELETE' })
}
