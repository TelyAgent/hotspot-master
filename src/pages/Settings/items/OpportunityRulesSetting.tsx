import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Alert, Button, Empty, Input, Spin, Tag } from 'antd'
import { EyeOutlined, ReloadOutlined, RobotOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import {
  activateOpportunityRulePack,
  createOpportunityRulePackAiDraft,
  createOpportunityRulePackDraft,
  getActiveOpportunityRulePack,
  resetOpportunityRulePack,
  testOpportunityRulePack,
  type OpportunityRuleDocument,
  type OpportunityRulePackRecord,
  type OpportunityRulePackSnapshot,
} from '../../../api/opportunity'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

export default function OpportunityRulesSetting() {
  const { openModal, closeModal, toast } = useApp()
  const editFormRef = useRef<RuleDocumentEditFormHandle>(null)
  const [rulePack, setRulePack] = useState<OpportunityRulePackSnapshot | null>(null)
  const [latestDraft, setLatestDraft] = useState<OpportunityRulePackRecord | null>(null)
  const [latestDraftTestPassed, setLatestDraftTestPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    let mounted = true
    void loadRulePack(mounted)
    return () => {
      mounted = false
    }
  }, [])

  const loadRulePack = async (mounted = true) => {
    setLoading(true)
    try {
      const nextRulePack = normalizeRulePackResponse(await getActiveOpportunityRulePack())
      if (!mounted) return
      if (!nextRulePack) {
        setRulePack(null)
        setError('规则包接口未返回有效的 documents 配置')
        return
      }
      setRulePack(nextRulePack)
      setLatestDraft(null)
      setLatestDraftTestPassed(false)
      setError(null)
    } catch (e) {
      if (!mounted) return
      setRulePack(null)
      setError(e instanceof Error ? e.message : '加载热点挖掘规则包失败')
    } finally {
      if (mounted) setLoading(false)
    }
  }

  const openDocumentViewer = (document: OpportunityRuleDocument) => {
    openModal(
      document.title,
      <div>
        <div className={styles.workflowMeta}>
          <span>文档 ID</span>
          <code>{document.id}</code>
        </div>
        <pre className={styles.workflowDoc}>{document.markdown}</pre>
      </div>,
      true,
      'large',
    )
  }

  const openDocumentEditor = (document: OpportunityRuleDocument) => {
    openModal(
      `编辑规则 · ${document.title}`,
      <RuleDocumentEditForm ref={editFormRef} document={document} />,
      false,
      'large',
      {
        label: '保存并测试草稿',
        onConfirm: async () => {
          const snapshot = editFormRef.current?.snapshot()
          if (!snapshot) {
            toast('规则文档内容不能为空')
            return
          }

          const draft = await createOpportunityRulePackDraft({
            description: snapshot.description || `修改 ${document.title}`,
            documents: [
              {
                id: document.id,
                title: document.title,
                markdown: snapshot.markdown,
              },
            ],
          })
          setLatestDraft(draft)
          const testResult = await testOpportunityRulePack({
            rulePackId: draft.id,
            instruction: '使用当前热点挖掘规则包做短流程测试，只输出判断结果，不写入正式机会。',
          })
          const passed = isTestPassed(testResult)
          setLatestDraftTestPassed(passed)
          closeModal()
          openModal(
            passed ? '草稿测试通过' : '草稿测试未通过',
            <RulePackTestResult
              draft={draft}
              passed={passed}
              result={testResult}
              suggestions={snapshot.suggestions}
            />,
            !passed,
            'large',
            passed
              ? {
                  label: '启用草稿',
                  onConfirm: async () => {
                    await activateOpportunityRulePack(draft.id)
                    await loadRulePack()
                    closeModal()
                    toast('规则包草稿已启用')
                  },
                }
              : undefined,
          )
          toast(passed ? `草稿 v${draft.version} 测试通过，可以启用` : `草稿 v${draft.version} 测试未通过，请继续调整`)
        },
      },
    )
  }

  const activateDraft = async () => {
    if (!latestDraft) {
      toast('请先编辑规则并保存草稿')
      return
    }
    if (!latestDraftTestPassed) {
      toast('草稿短流程测试通过后才能启用')
      return
    }

    setActivating(true)
    try {
      await activateOpportunityRulePack(latestDraft.id)
      await loadRulePack()
      toast('规则包草稿已启用')
    } catch (e) {
      toast(e instanceof Error ? e.message : '启用规则包失败')
    } finally {
      setActivating(false)
    }
  }

  const resetToPreset = async () => {
    setResetting(true)
    try {
      await resetOpportunityRulePack()
      await loadRulePack()
      toast('热点挖掘规则包已恢复预设')
    } catch (e) {
      toast(e instanceof Error ? e.message : '恢复预设失败')
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.rulePackHero}>
        <div>
          <div className={styles.kicker}>OPPORTUNITY RULE PACK</div>
          <h2>热点挖掘规则包</h2>
          <p>规则修改会保存为数据库草稿；不会覆盖项目里的预设 Markdown 文档。</p>
        </div>
        <div className={styles.rulePackToolbar}>
          <Button icon={<UndoOutlined />} onClick={resetToPreset} loading={resetting}>
            恢复预设
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadRulePack()} loading={loading}>
            重新加载
          </Button>
          <Button type="primary" onClick={activateDraft} loading={activating} disabled={!latestDraft || !latestDraftTestPassed}>
            启用草稿
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={styles.rulePackState}>
          <Spin tip="正在加载热点挖掘规则包…" />
        </div>
      ) : error ? (
        <div className={styles.rulePackBody}>
          <Alert type="warning" message={`规则包加载失败：${error}`} showIcon />
        </div>
      ) : rulePack ? (
        <div className={styles.rulePackBody}>
          <div className={styles.rulePackSummary}>
            <div>
              <span>当前版本</span>
              <strong>v{rulePack.version}</strong>
              <small>{formatRulePackStatus(rulePack.status)}</small>
            </div>
            <div>
              <span>规则文档</span>
              <strong>{rulePack.documents.length} 个</strong>
              <small>可查看、编辑和测试</small>
            </div>
            <div>
              <span>路由配置</span>
              <strong>{formatRouteCount(rulePack.routes)} 条</strong>
              <small>{formatRuleRoutes(rulePack.routes)}</small>
            </div>
            <div>
              <span>草稿状态</span>
              <strong>{latestDraft ? `v${latestDraft.version}` : '暂无'}</strong>
              <small>
                {latestDraft
                  ? latestDraftTestPassed
                    ? '测试通过，允许启用'
                    : '测试未通过，继续调整'
                  : '暂无待启用草稿'}
              </small>
            </div>
          </div>

          <div className={styles.ruleDocPanel}>
            <div className={styles.ruleDocPanelHeader}>
              <div>
                <h3>规则文档</h3>
                <p>每个文档负责一类判断原则或来源规则，编辑后会先生成草稿并跑短流程测试。</p>
              </div>
            </div>
            <div className={styles.ruleDocList}>
              {rulePack.documents.map((document) => (
                <div key={document.id} className={styles.ruleDocItem}>
                  <div className={styles.ruleDocTitle}>
                    <strong>{document.title}</strong>
                    <span>{document.id}</span>
                  </div>
                  <div className={styles.ruleDocMeta}>
                    <Tag>{document.markdown.split(/\r?\n/).length} 行</Tag>
                  </div>
                  <div className={styles.inlineActions}>
                    <Button icon={<EyeOutlined />} onClick={() => openDocumentViewer(document)}>
                      查看
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => openDocumentEditor(document)}>
                      编辑
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.rulePackBody}>
          <Empty description="规则包未加载" />
        </div>
      )}
    </section>
  )
}

interface RuleDocumentEditFormHandle {
  snapshot: () => null | {
    markdown: string
    description: string
    suggestions: string[]
  }
}

const RuleDocumentEditForm = forwardRef<
  RuleDocumentEditFormHandle,
  { document: OpportunityRuleDocument }
>(({ document }, ref) => {
  const [markdown, setMarkdown] = useState(document.markdown)
  const [description, setDescription] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiError, setAiError] = useState<string | null>(null)
  const [rewriting, setRewriting] = useState(false)

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const trimmedMarkdown = markdown.trim()
      if (!trimmedMarkdown) return null
      return {
        markdown,
        description: description.trim(),
        suggestions: aiSuggestions,
      }
    },
  }), [aiSuggestions, description, markdown])

  const rewriteWithAi = async () => {
    const instruction = aiInstruction.trim()
    if (!instruction) return

    setRewriting(true)
    setAiError(null)
    try {
      const result = await createOpportunityRulePackAiDraft({
        documentId: document.id,
        instruction,
      })
      setMarkdown(result.document.markdown)
      setDescription(result.changeSummary)
      setAiSuggestions(result.suggestions)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 修改规则失败')
    } finally {
      setRewriting(false)
    }
  }

  return (
    <div className={styles.topicForm}>
      <div className={styles.workflowMeta}>
        <span>文档 ID</span>
        <code>{document.id}</code>
        <span>保存方式</span>
        <code>生成数据库草稿，不覆盖预设文件</code>
      </div>
      <div className="field full">
        <label>希望 AI 怎么改</label>
        <Input.TextArea
          rows={4}
          value={aiInstruction}
          onChange={(event) => setAiInstruction(event.target.value)}
          placeholder="例如：让热搜形成事件更严格，避免普通娱乐八卦和重复地区上榜误触发。"
        />
      </div>
      <div className={styles.inlineActions}>
        <Button
          icon={<RobotOutlined />}
          onClick={rewriteWithAi}
          loading={rewriting}
          disabled={!aiInstruction.trim()}
        >
          AI 帮我改
        </Button>
      </div>
      {aiSuggestions.length > 0 ? (
        <Alert
          type="info"
          message={`AI 建议：${aiSuggestions.join('；')}`}
          showIcon
        />
      ) : null}
      {aiError ? <Alert type="warning" message={aiError} showIcon /> : null}
      <div className="field full">
        <label>草稿说明</label>
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="例如：提高热点去重要求；降低普通榜单波动的触发敏感度。"
        />
      </div>
      <div className="field full">
        <label>规则内容</label>
        <Input.TextArea
          rows={20}
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
        />
      </div>
    </div>
  )
})

RuleDocumentEditForm.displayName = 'RuleDocumentEditForm'

function RulePackTestResult({
  draft,
  passed,
  result,
  suggestions,
}: {
  draft: OpportunityRulePackRecord
  passed: boolean
  result: unknown
  suggestions: string[]
}) {
  return (
    <div className={styles.rulePackEditor}>
      <Alert
        type={passed ? 'success' : 'warning'}
        message={passed ? `草稿 v${draft.version} 已通过短流程测试` : `草稿 v${draft.version} 未通过短流程测试`}
        description={passed ? formatTestDecisionDescription(result) : undefined}
        showIcon
      />
      {suggestions.length > 0 ? (
        <div className={styles.topicWatchSubsection}>
          <h4>AI 修改建议</h4>
          {suggestions.map((item, index) => (
            <div key={`${index}-${item}`} className={styles.topicRuleItem}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
      <pre className={styles.workflowDoc}>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}

function normalizeRulePackResponse(
  value: OpportunityRulePackSnapshot | OpportunityRulePackRecord | null,
): OpportunityRulePackSnapshot | null {
  if (isRulePackSnapshot(value)) return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const candidate = value as Partial<OpportunityRulePackRecord>
  const documents = candidate.manifest?.documents
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.version !== 'number' ||
    !isRulePackStatus(candidate.status) ||
    !Array.isArray(documents)
  ) {
    return null
  }

  return {
    id: candidate.id,
    version: candidate.version,
    status: candidate.status,
    basePath: typeof candidate.basePath === 'string' ? candidate.basePath : '',
    documents,
    routes: [],
  }
}

function isRulePackSnapshot(value: unknown): value is OpportunityRulePackSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<OpportunityRulePackSnapshot>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.version === 'number' &&
    Array.isArray(candidate.documents) &&
    Array.isArray(candidate.routes)
  )
}

function isRulePackStatus(value: unknown): value is OpportunityRulePackSnapshot['status'] {
  return value === 'preset' || value === 'draft' || value === 'active' || value === 'archived'
}

function formatRulePackStatus(status: string) {
  const labels: Record<string, string> = {
    preset: '预设',
    draft: '草稿',
    active: '已启用',
    archived: '已归档',
  }
  return labels[status] ?? status
}

function formatRuleRoutes(routes: OpportunityRulePackSnapshot['routes']) {
  if (!routes.length) return '未解析到路由'
  return routes.map((route) => `${route.signalType}:${route.documents.length}`).join('，')
}

function formatRouteCount(routes: OpportunityRulePackSnapshot['routes']) {
  return routes.reduce((sum, route) => sum + route.documents.length, 0)
}

function isTestPassed(result: unknown) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return false
  const candidate = result as { status?: unknown; errorMessage?: unknown; result?: unknown; decision?: unknown; agentRunId?: unknown }
  if (candidate.errorMessage) return false
  if (candidate.status === 'passed') return true
  if (candidate.status === 'succeeded') return true
  return Boolean(candidate.result || candidate.decision || candidate.agentRunId)
}

function formatTestDecisionDescription(result: unknown) {
  const decision = extractDecisionName(result)
  if (decision === 'request_human_review') {
    return '测试样本触发了人工复核判断，这表示规则链路可运行；它不是规则文档测试失败。'
  }
  if (decision) {
    return `测试样本业务判断：${decision}`
  }
  return '短流程测试已跑通，未发现规则文档结构错误。'
}

function extractDecisionName(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const object = value as Record<string, unknown>
  const direct = object.decision
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    const name = (direct as Record<string, unknown>).decision
    return typeof name === 'string' ? name : undefined
  }
  const nested = object.result
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return extractDecisionName(nested)
  }
  return undefined
}
