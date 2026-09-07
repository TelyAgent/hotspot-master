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

export interface SignalRecord {
  id: string
  source: string
  platform?: string | null
  signalType: string
  title: string
  summary?: string | null
  observedAt: string
  metrics?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

export interface KolRadarFeedItem {
  id: string
  handle: string
  authorName: string | null
  title: string
  summary: string
  observedAt: string
  publishedAt: string | null
  postType: string | null
  url: string | null
  metrics: {
    views?: number
    likes?: number
    replies?: number
    quotes?: number
    reposts?: number
    bookmarks?: number
  }
}

export interface KolRadarFeedResponse {
  collectedAt: string
  windowHours?: number
  items: KolRadarFeedItem[]
}
