import { request } from './client'

export interface WorkflowDocumentResponse {
  definition: {
    workflowId: string
    name?: string
    version?: string
    status?: string
  }
  markdown: string
}

export function getXTrendWorkflowDocument() {
  return request<WorkflowDocumentResponse>('/workflows/event-formation/x-trend/document')
}
