import { request } from './client'

export type OverviewRange = '7d' | '30d' | '1y'

export interface OverviewStats {
  wellPerformingRate: number
  wellPerformingCount: number
  publishedCount: number
  totalViews?: number
  totalInteractions: number
  publishedAccounts: number
  avgFirstPublishLatencyMs?: number
}

export interface OverviewTrendPoint {
  date: string
  views?: number
  interactions: number
  publishedCount: number
}

export interface OverviewAccountPerformance {
  accountId: string
  name: string
  wellPerformingRate: number
  avgViews?: number
  publishedCount: number
  score: number
}

export interface OverviewManualItem {
  severity: 'normal' | 'warning' | 'critical'
  title: string
  description: string
  taskId?: string
  eventId?: string
  actionPage: 'tasks' | 'events' | 'insights'
}

export interface OverviewAnomaly {
  severity: 'warning' | 'critical'
  type: string
  count: number
  description: string
  actionPage: 'tasks' | 'insights'
}

export interface OverviewTaskGroup {
  eventId: string
  eventTitle: string
  taskCount: number
  completedCount: number
  progressPercent: number
  statusLabel: string
}

export interface OverviewResponse {
  range: OverviewRange
  stats: OverviewStats
  trend: OverviewTrendPoint[]
  accountPerformance: OverviewAccountPerformance[]
  manualItems: OverviewManualItem[]
  anomalies: OverviewAnomaly[]
  taskGroups: OverviewTaskGroup[]
}

export function getOverview(range: OverviewRange): Promise<OverviewResponse> {
  return request(`/overview?range=${encodeURIComponent(range)}`)
}
