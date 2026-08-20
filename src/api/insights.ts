import { request } from './client'

export interface InsightsAccount {
  accountId: string
  name: string
  publishedPosts: number
  avgViews?: number
  avgLikes: number
  avgReplies: number
  avgReposts: number
  wellPerformingRate: number
}

export interface InsightsTrackingIssue {
  publicationRecordId: string
  taskId: string
  eventId: string
  accountId: string
  accountName: string
  url: string
  trackingStatus: string
  lastTrackingError: string
  lastTrackingErrorAt: string
  trackingFailureCount: number
}

export interface InsightsResponse {
  range: string
  stats: {
    trackingPosts: number
    wellPerformingRate: number
    avgInteractionRate: number
    totalLikes: number
    totalReplies: number
    totalReposts: number
    totalQuotes?: number
    totalViews?: number
    trackingErrorPosts: number
  }
  accounts: InsightsAccount[]
  trackingIssues: InsightsTrackingIssue[]
}

export function getInsights(range: string): Promise<InsightsResponse> {
  return request(`/insights?range=${encodeURIComponent(range)}`)
}
