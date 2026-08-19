export interface TrendingItem {
  rank: number
  name: string
  query: string
  url: string
  heat: string
}

export interface TrendingResponse {
  region: string
  collectedAt: string
  source: 'twitter' | 'mock'
  items: TrendingItem[]
}

export interface RefreshResponse {
  status: string
  message: string
  fetchRunId?: string
  itemCount?: number
  error?: string
}
