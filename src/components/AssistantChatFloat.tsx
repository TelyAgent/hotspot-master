import { FormEvent, useMemo, useState } from 'react'
import { Button, FloatButton, Input, Spin } from 'antd'
import { RobotOutlined, SendOutlined } from '@ant-design/icons'
import {
  executeAssistantTool,
  rejectAssistantAction,
  sendAssistantMessage,
  type AssistantProposedAction,
} from '../api/assistant'
import { useApp } from '../context/AppContext'
import styles from './AssistantChatFloat.module.css'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  tone?: 'normal' | 'error'
  proposedActions?: AssistantProposedAction[]
}

export default function AssistantChatFloat() {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string>()
  const [sending, setSending] = useState(false)
  const [executingActionId, setExecutingActionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '可以直接问我当前页面、配置或运营流程相关的问题。',
    },
  ])

  const context = useMemo(
    () => ({
      page: app.page,
      setting: app.setting,
      region: app.region,
      event: app.event,
    }),
    [app.event, app.page, app.region, app.setting],
  )

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, createMessage('user', content)])

    try {
      const response = await sendAssistantMessage(content, context, sessionId)
      if (response.sessionId) {
        setSessionId(response.sessionId)
      }
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', response.message, 'normal', response.proposedActions),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : '服务暂不可用'
      setMessages((prev) => [...prev, createMessage('assistant', message, 'error')])
    } finally {
      setSending(false)
    }
  }

  const updateActionStatus = (actionId: string, status: NonNullable<AssistantProposedAction['status']>) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (!message.proposedActions?.length) return message
        return {
          ...message,
          proposedActions: message.proposedActions.map((action) =>
            action.id === actionId ? { ...action, status } : action,
          ),
        }
      }),
    )
  }

  const executeAction = async (action: AssistantProposedAction) => {
    if (executingActionId) return
    setExecutingActionId(action.id)
    try {
      const result = await executeAssistantTool(action)
      updateActionStatus(action.id, (result.status as AssistantProposedAction['status']) ?? 'succeeded')
      setMessages((prev) => [...prev, createMessage('assistant', result.message)])
    } catch (error) {
      const message = error instanceof Error ? error.message : '执行失败'
      setMessages((prev) => [...prev, createMessage('assistant', message, 'error')])
    } finally {
      setExecutingActionId(null)
    }
  }

  const rejectAction = async (action: AssistantProposedAction) => {
    if (executingActionId) return
    setExecutingActionId(action.id)
    try {
      const result = await rejectAssistantAction(action)
      updateActionStatus(action.id, (result.status as AssistantProposedAction['status']) ?? 'rejected')
      setMessages((prev) => [...prev, createMessage('assistant', result.message)])
    } catch (error) {
      const message = error instanceof Error ? error.message : '拒绝失败'
      setMessages((prev) => [...prev, createMessage('assistant', message, 'error')])
    } finally {
      setExecutingActionId(null)
    }
  }

  if (!open) {
    return (
      <FloatButton
        className={styles.launcher}
        onClick={() => setOpen(true)}
        tooltip="AI 助手"
        icon={<RobotOutlined />}
      />
    )
  }

  return (
    <section className={styles.panel} aria-label="AI 助手对话">
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <b>AI 助手</b>
          <span className="small">当前页面：{app.page}</span>
        </div>
        <Button size="small" onClick={() => setOpen(false)}>
          收起
        </Button>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              styles.message,
              message.role === 'user' ? styles.user : styles.assistant,
              message.tone === 'error' ? styles.error : '',
            ].join(' ')}
          >
            {message.text}
            {message.proposedActions?.length ? (
              <div className={styles.proposedActions}>
                {message.proposedActions.map((action) => (
                  <div key={action.id} className={styles.proposedAction}>
                    <span>{action.summary}</span>
                    {action.status && action.status !== 'pending' ? (
                      <span className={styles.actionStatus}>
                        {action.status === 'succeeded' ? '已应用' : action.status === 'rejected' ? '已拒绝' : '执行失败'}
                      </span>
                    ) : (
                      <div className={styles.actionButtons}>
                        <Button
                          size="small"
                          type="primary"
                          loading={executingActionId === action.id}
                          disabled={executingActionId != null && executingActionId !== action.id}
                          onClick={() => executeAction(action)}
                        >
                          {executingActionId === action.id ? '应用中...' : '确认应用'}
                        </Button>
                        <Button
                          size="small"
                          disabled={executingActionId != null}
                          onClick={() => rejectAction(action)}
                        >
                          拒绝
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {sending ? <div className={`${styles.message} ${styles.assistant}`}><Spin size="small" /> 正在回复...</div> : null}
      </div>

      <form className={styles.composer} onSubmit={send}>
        <Input.TextArea
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入消息"
        />
        <div className={styles.actions}>
          <span className="small">上下文会随请求发送</span>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} disabled={!input.trim()}>
            发送
          </Button>
        </div>
      </form>
    </section>
  )
}

function createMessage(
  role: ChatMessage['role'],
  text: string,
  tone: ChatMessage['tone'] = 'normal',
  proposedActions?: AssistantProposedAction[],
) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    tone,
    proposedActions,
  }
}
