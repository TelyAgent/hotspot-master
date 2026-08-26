import { request } from './client'
import type { EventMergeDetail } from '../data/types'

export function getEventMergeDetail(eventId: string): Promise<EventMergeDetail> {
  return request(`/events/${encodeURIComponent(eventId)}/merge-detail`)
}
