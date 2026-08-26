import { request } from './client'

export interface YoutubeRun {
  id: string
  runDate: string
  status: string
  officialCount: number
  keywordCount: number
  newVideoCount: number
  historicalCount: number
  errorMessage?: string | null
  startedAt: string
  finishedAt?: string | null
}

export interface YoutubeBoardVideo {
  videoId: string
  title: string
  url: string
  thumbnailUrl: string | null
  channelTitle: string | null
  publishedAt: string | null
  consecutiveHotDays: number
  boardVisibleUntil: string
  selectionSources: { type: string; label: string; rank: number }[]
  matchedKeywords: string[]
  keywordHitCount: number
  discoveryLabels: string[]
  videoMetrics: {
    viewCount?: number | null
    likeCount?: number | null
    commentCount?: number | null
  } | null
  analysisStatus: string | null
  transcriptStatus: string | null
  analysis: {
    mainReason: {
      topic: string
      why_attractive: string
      traffic_judgment: string
    } | null
    execution: {
      key_technique: string
      effect: string
    } | null
    replication: {
      reusable_mechanism: string
      product_remix_topic: string
      product_entry: string
    } | null
    limitations: string[]
  } | null
}

export interface YoutubeBoardResponse {
  videos: YoutubeBoardVideo[]
}

export function fetchYoutubeBoard(): Promise<YoutubeBoardResponse> {
  return request('/youtube/videos/board')
}

export function fetchLatestYoutubeRun(): Promise<YoutubeRun | null> {
  return request('/youtube/runs/latest')
}

export function runYoutubeCollection(): Promise<YoutubeRun> {
  return request('/youtube/run', { method: 'POST' })
}

export function analyzeYoutubeVideo(videoId: string): Promise<unknown> {
  return request(`/youtube/videos/${encodeURIComponent(videoId)}/analyze`, { method: 'POST' })
}
