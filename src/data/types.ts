export type PageId =
  | 'overview'
  | 'monitor'
  | 'events'
  | 'future'
  | 'tasks'
  | 'insights'
  | 'settings'

export interface TrendItem {
  rank: number
  name: string
  change: string
  signal: '已触发' | '持续观察'
  heat: string
}

export interface EventItem {
  id: string
  title: string
  summary: string
  status: string
  verify: string
  regions: string
  trigger: string
  urls: string[]
  related: string[]
}

export interface TaskItem {
  id: string
  eventId?: string
  code: string
  event: string
  account: string
  role: string
  status: string
  risk: string
  time: string
  copies: string[]
}
