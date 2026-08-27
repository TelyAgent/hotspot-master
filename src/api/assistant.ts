import { request } from './client'

export interface AssistantChatContext {
  page: string
  setting?: string
  region?: string
  event?: string
}

export interface AssistantChatResponse {
  sessionId?: string
  runId?: string
  message: string
  proposedActions: AssistantProposedAction[]
  usedTools?: unknown[]
  missingData?: unknown[]
  suggestedNextSteps?: unknown[]
}

export function sendAssistantMessage(
  message: string,
  context: AssistantChatContext,
  sessionId?: string,
) {
  return request<AssistantChatResponse>('/copilot/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      tenantId: 'default',
      userId: 'local-user',
      client: 'hotspot-master',
      message,
      context,
    }),
  })
}

export type AssistantToolName = string

export interface AssistantProposedAction {
  id: string
  tool: AssistantToolName
  summary: string
  arguments: Record<string, unknown>
  requiresConfirmation: true
  status?: 'pending' | 'succeeded' | 'failed' | 'rejected'
}

export interface AssistantToolExecutionResponse {
  status?: string
  message: string
  result?: unknown
}

export function executeAssistantTool(action: AssistantProposedAction) {
  return request<AssistantToolExecutionResponse>(`/copilot/actions/${action.id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      confirmedBy: 'local-user',
    }),
  })
}

export function rejectAssistantAction(action: AssistantProposedAction) {
  return request<AssistantToolExecutionResponse>(`/copilot/actions/${action.id}/reject`, {
    method: 'POST',
    body: JSON.stringify({
      rejectedBy: 'local-user',
    }),
  })
}
