import { FormEvent, useMemo, useState } from 'react'
import {
  executeAssistantTool,
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
      const response = await sendAssistantMessage(content, context)
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

  const executeAction = async (action: AssistantProposedAction) => {
    if (executingActionId) return
    setExecutingActionId(action.id)
    try {
      const result = await executeAssistantTool({
        tool: action.tool,
        arguments: action.arguments,
      })
      setMessages((prev) => [...prev, createMessage('assistant', result.message)])
    } catch (error) {
      const message = error instanceof Error ? error.message : '执行失败'
      setMessages((prev) => [...prev, createMessage('assistant', message, 'error')])
    } finally {
      setExecutingActionId(null)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen(true)}
        aria-label="打开 AI 助手"
        title="AI 助手"
      >
        AI
      </button>
    )
  }

  return (
    <section className={styles.panel} aria-label="AI 助手对话">
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <b>AI 助手</b>
          <span className="small">当前页面：{app.page}</span>
        </div>
        <button type="button" className="btn mini" onClick={() => setOpen(false)}>
          收起
        </button>
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
                    <button
                      type="button"
                      className="btn mini"
                      disabled={executingActionId != null}
                      onClick={() => executeAction(action)}
                    >
                      {executingActionId === action.id ? '应用中...' : '确认应用'}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {sending ? <div className={`${styles.message} ${styles.assistant}`}>正在回复...</div> : null}
      </div>

      <form className={styles.composer} onSubmit={send}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入消息"
        />
        <div className={styles.actions}>
          <span className="small">上下文会随请求发送</span>
          <button type="submit" className="btn primary" disabled={sending || !input.trim()}>
            发送
          </button>
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
