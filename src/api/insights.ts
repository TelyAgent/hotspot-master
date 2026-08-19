import { request } from './client'

export interface InsightsAccount {
  name: string
  avgViews: number
  wellPerformingRate: number
}

export interface InsightsResponse {
  range: string
  stats: {
    trackingPosts: number
    wellPerformingRate: number
    avgInteractionRate: number
  }
  accounts: InsightsAccount[]
}

export function getInsights(range: string): Promise<InsightsResponse> {
  return request(`/insights?range=${range}`)
}
