import { request } from './client'

export interface WorkflowDocumentResponse {
  workflowId: string
  activeVersion: WorkflowVersion
  systemVersion: WorkflowVersion
  history: WorkflowVersion[]
}

export interface WorkflowVersion {
  id: string
  workflowId: string
  version: string
  source: string
  status: string
  title: string
  markdown: string
  changeSummary?: string
  riskNotes: unknown[]
  baseVersionId?: string
  createdBy: string
  createdAt: string
  activatedAt?: string
  archivedAt?: string
  isDatabaseVersion: boolean
}

export interface WorkflowAuditLog {
  id: string
  workflowId: string
  versionId?: string
  action: string
  actor: string
  summary?: string
  payload: unknown
  createdAt: string
}

export interface WorkflowDiffLine {
  type: 'added' | 'removed' | 'unchanged'
  text: string
}

export interface WorkflowVersionDiff {
  baseVersionId: string
  compareVersionId: string
  summary: {
    added: number
    removed: number
    unchanged: number
  }
  lines: WorkflowDiffLine[]
}

export function getXTrendWorkflowDocument() {
  return getWorkflowDocument('x-trend-event-formation')
}

export function createXTrendWorkflowDraft(instruction: string) {
  return createWorkflowDraft('x-trend-event-formation', instruction)
}

export interface WorkflowShortTestResult {
  id: string
  workflowVersionId: string
  status: string
  errorMessage?: string
  dryRunResult?: unknown
  startedAt: string
  finishedAt?: string
}

export function testXTrendWorkflowVersion(versionId: string) {
  return testWorkflowVersion('x-trend-event-formation', versionId)
}

export function activateXTrendWorkflowVersion(versionId: string) {
  return activateWorkflowVersion('x-trend-event-formation', versionId)
}

export function resetXTrendWorkflowToSystemDefault() {
  return resetWorkflowToSystemDefault('x-trend-event-formation')
}

export function repairXTrendWorkflowVersion(versionId: string) {
  return repairWorkflowVersion('x-trend-event-formation', versionId)
}

export function getXTrendWorkflowAuditLogs() {
  return getWorkflowAuditLogs('x-trend-event-formation')
}

export function getXTrendWorkflowVersionDiff(versionId: string, baseVersionId: string) {
  return getWorkflowVersionDiff('x-trend-event-formation', versionId, baseVersionId)
}

export function getWorkflowDocument(workflowId: string) {
  return request<WorkflowDocumentResponse>(`/workflows/${workflowId}`)
}

export function createWorkflowDraft(workflowId: string, instruction: string) {
  return request<{ draftVersion: WorkflowVersion }>(`/workflows/${workflowId}/drafts`, {
    method: 'POST',
    body: JSON.stringify({ instruction }),
  })
}

export function testWorkflowVersion(workflowId: string, versionId: string) {
  return request<WorkflowShortTestResult>(`/workflows/${workflowId}/versions/${versionId}/test`, {
    method: 'POST',
  })
}

export function activateWorkflowVersion(workflowId: string, versionId: string) {
  return request<{ activeVersion: WorkflowVersion }>(`/workflows/${workflowId}/versions/${versionId}/activate`, {
    method: 'POST',
  })
}

export function resetWorkflowToSystemDefault(workflowId: string) {
  return request<{ activeVersion: WorkflowVersion }>(`/workflows/${workflowId}/reset`, {
    method: 'POST',
  })
}

export function repairWorkflowVersion(workflowId: string, versionId: string) {
  return request<{ draftVersion: WorkflowVersion }>(`/workflows/${workflowId}/versions/${versionId}/repair`, {
    method: 'POST',
  })
}

export function getWorkflowAuditLogs(workflowId: string) {
  return request<{ workflowId: string; logs: WorkflowAuditLog[] }>(`/workflows/${workflowId}/audit-logs`)
}

export function getWorkflowVersionDiff(workflowId: string, versionId: string, baseVersionId: string) {
  const params = new URLSearchParams({ baseVersionId })
  return request<WorkflowVersionDiff>(`/workflows/${workflowId}/versions/${versionId}/diff?${params.toString()}`)
}
