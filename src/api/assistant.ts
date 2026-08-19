import { request } from './client'

export interface AssistantChatContext {
  page: string
  setting?: string
  region?: string
  event?: string
}

export interface AssistantChatResponse {
  message: string
  proposedActions?: AssistantProposedAction[]
}

export function sendAssistantMessage(message: string, context: AssistantChatContext) {
  return request<AssistantChatResponse>('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  })
}

export type AssistantToolName =
  | 'get_twitter_config'
  | 'update_twitter_config'
  | 'list_twitter_topics'
  | 'upsert_twitter_topic'
  | 'add_twitter_topic_account'
  | 'remove_twitter_topic_account'
  | 'set_twitter_trend_schedule'

export interface AssistantProposedAction {
  id: string
  tool: AssistantToolName
  summary: string
  arguments: Record<string, unknown>
  requiresConfirmation: true
}

export interface AssistantToolExecutionResponse {
  message: string
  result?: unknown
}

export function executeAssistantTool(action: Pick<AssistantProposedAction, 'tool' | 'arguments'>) {
  return request<AssistantToolExecutionResponse>('/assistant/tool-executions', {
    method: 'POST',
    body: JSON.stringify(action),
  })
}
