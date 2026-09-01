import type { PageId } from './types'

export const PAGE_LABELS: Record<PageId, string> = {
  overview: '运营总览',
  monitor: '热点监测',
  decision: '运营决策',
  events: '事件管理',
  future: '运营排期',
  insights: '复盘优化',
  settings: '系统设置',
}

export const NAV_ITEMS: { page: PageId; label: string; sub: string }[] = [
  { page: 'monitor', label: '热点监测', sub: 'Hotspot Monitoring' },
  { page: 'future', label: '运营排期', sub: 'Operations Schedule' },
  { page: 'events', label: '事件管理', sub: 'Event Management' },
  { page: 'insights', label: '复盘优化', sub: 'Insights' },
]
