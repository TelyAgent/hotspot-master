import { request } from './client'
import type { SettingItem } from './settings'

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
export async function getAccounts(type?: string): Promise<AccountItem[]> {
  const items = await request<SettingItem[]>('/settings/accounts')
  const accounts = items.map(mapSettingAccount)
  if (!type || type === '全部') return accounts
  return accounts.filter((item) => item.type === type)
}

/** 获取所有账号类型（供筛选下拉） */
export async function getAccountTypes(): Promise<string[]> {
  const accounts = await getAccounts()
  return Array.from(new Set(accounts.map((item) => item.type).filter(Boolean)))
}

function mapSettingAccount(item: SettingItem): AccountItem {
  const field = (key: string) => {
    const value = item[key]
    return typeof value === 'string' ? value : ''
  }

  return {
    id: item.id,
    name: item.name,
    type: field('type'),
    layer: field('scenario'),
    skill: field('skill'),
    persona: field('personaType') || item.description,
    xHandle: field('xAccountId') || null,
    takesAllEvents: Boolean(item.enabled),
    status: item.enabled ? '启用' : '停用',
  }
}
