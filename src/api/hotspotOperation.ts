import { request } from './client'

export interface HotspotDraft {
  id: string
  contentTaskId: string
  version: number
  body: string
  evidenceRefs: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface HotspotDraftResponse {
  eventId: string
  contentTaskId: string
  drafts: HotspotDraft[]
}

export function getHotspotDrafts(eventId: string): Promise<HotspotDraftResponse> {
  return request(`/hotspot-operation/events/${encodeURIComponent(eventId)}/drafts`)
}

export function generateHotspotPosts(
  eventId: string,
  userInstruction?: string,
): Promise<HotspotDraftResponse> {
  return request(`/hotspot-operation/events/${encodeURIComponent(eventId)}/drafts/generate`, {
    method: 'POST',
    body: JSON.stringify(userInstruction ? { userInstruction } : {}),
  })
}

export function publishHotspotPost(
  eventId: string,
  draftId: string,
  url: string,
  accountName: string,
): Promise<{ id: string; url: string; trackingStatus: string }> {
  return request(`/hotspot-operation/events/${encodeURIComponent(eventId)}/publish`, {
    method: 'POST',
    body: JSON.stringify({ draftId, url, accountName }),
  })
}
