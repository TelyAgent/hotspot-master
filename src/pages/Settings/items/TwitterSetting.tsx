import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Empty, Input, InputNumber, Select, Spin } from 'antd'
import { EyeOutlined, HistoryOutlined, PlusOutlined, ReloadOutlined, RobotOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
  type TopicTrackingConfig,
} from '../../../api/collectionConfig'
import {
  activateWorkflowVersion as activateWorkflowVersionRequest,
  createWorkflowDraft,
  getWorkflowAuditLogs,
  getWorkflowDocument,
  getWorkflowVersionDiff,
  resetWorkflowToSystemDefault,
  repairWorkflowVersion,
  testWorkflowVersion,
  type WorkflowVersion,
} from '../../../api/workflow'
import { useApp } from '../../../context/AppContext'
import { SettingRow } from '../SettingRow'
import styles from '../Settings.module.css'

const REGION_OPTIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']

const FREQUENCY_OPTIONS = [
  { label: '每 1 小时', value: 60 * 60 * 1000 },
  { label: '每 2 小时', value: 2 * 60 * 60 * 1000 },
  { label: '每 4 小时', value: 4 * 60 * 60 * 1000 },
  { label: '每 6 小时', value: 6 * 60 * 60 * 1000 },
]

interface WorkflowUiConfig {
  id: string
  label: string
  loadingText: string
  fallbackSummary: string
}

const X_TREND_WORKFLOW: WorkflowUiConfig = {
  id: 'x-trend-event-formation',
  label: '榜单形成事件工作流',
  loadingText: '正在加载榜单形成事件工作流文档…',
  fallbackSummary: '系统预置榜单形成事件工作流',
}

const TOPIC_EVENT_WORKFLOW: WorkflowUiConfig = {
  id: 'event-formation',
  label: '主题追踪形成事件工作流',
  loadingText: '正在加载主题追踪形成事件工作流文档…',
  fallbackSummary: '系统预置主题追踪形成事件工作流',
}

export default function TwitterSetting() {
  const { openModal, closeModal, toast } = useApp()
  const formRef = useRef<TopicConfigFormHandle>(null)
  const workflowDraftRef = useRef<WorkflowDraftFormHandle>(null)
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequencyMs, setFrequencyMs] = useState(2 * 60 * 60 * 1000)
  const [trendLimit, setTrendLimit] = useState('30')
  const [workflowId, setWorkflowId] = useState('x-trend-event-formation')
  const [topics, setTopics] = useState<TopicTrackingConfig[]>([])

  const frequencyLabel = useMemo(
    () => FREQUENCY_OPTIONS.find((item) => item.value === frequencyMs)?.label ?? `${Math.round(frequencyMs / 3600000)} 小时`,
    [frequencyMs],
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const nextConfig = await getPlatformCollectionConfig('x')
        if (!mounted) return
        setConfig(nextConfig)
        setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
        setFrequencyMs(resolveTrendIntervalMs(nextConfig))
        setTrendLimit(String(nextConfig.variables.defaultTrendLimit ?? 30))
        setWorkflowId(nextConfig.variables.trendEventWorkflowId ?? 'x-trend-event-formation')
        setTopics(normalizeTopicConfigs(nextConfig))
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : '加载 Twitter 配置失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [])

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((item) => item !== region) : [...prev, region],
    )
  }

  const save = async () => {
    if (!config) return
    const nextTrendLimit = normalizeTrendLimit(trendLimit)
    if (!nextTrendLimit) {
      toast('榜单条数请输入 1-30 之间的整数')
      return
    }
    setSaving(true)
    try {
      const flattened = flattenTopicConfigs(topics)
      const nextVariables = {
        ...config.variables,
        regions,
        defaultTrendLimit: nextTrendLimit,
        trendCollectionIntervalMs: frequencyMs,
        trendEventWorkflowId: workflowId,
        topicConfigs: topics,
        topicKeywords: flattened.topicKeywords,
        topicNegativeKeywords: flattened.topicNegativeKeywords,
        monitoredAccounts: flattened.monitoredAccounts,
      }
      const nextConfig = await updatePlatformCollectionConfig('x', {
        defaultRegions: regions,
        variables: nextVariables,
      })
      setConfig(nextConfig)
      toast('Twitter 配置已保存')
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存 Twitter 配置失败')
    } finally {
      setSaving(false)
    }
  }

  const openTopicConfig = (topic?: TopicTrackingConfig, index?: number) => {
    openModal(
      `${topic ? '配置' : '新增'} · 重点主题`,
      <TopicConfigForm
        ref={formRef}
        topic={topic}
        defaultPostLimit={config?.variables.defaultPostLimit ?? 30}
      />,
      false,
      'large',
      {
        label: '保存',
        onConfirm: () => {
          const next = formRef.current?.snapshot()
          if (!next) {
            toast('请输入主题名称')
            return
          }
          setTopics((prev) => {
            if (typeof index === 'number') {
              return prev.map((item, i) => (i === index ? next : item))
            }
            return [...prev, next]
          })
          closeModal()
        },
      },
    )
  }

  const openWorkflowDocument = async (workflow: WorkflowUiConfig = X_TREND_WORKFLOW) => {
    openModal(workflow.label, <div className="note">{workflow.loadingText}</div>, true, 'large')
    try {
      const document = await getWorkflowDocument(workflow.id)
      const active = document.activeVersion
      openModal(
        `${active.title || workflow.label} · ${active.version}`,
        <div>
          <div className={styles.workflowMeta}>
            <span>当前来源</span>
            <code>{formatWorkflowSource(active.source)} / {active.isDatabaseVersion ? '数据库版本' : '系统默认文件'}</code>
            <span>当前状态</span>
            <code>{active.status}</code>
            <span>系统默认版本</span>
            <code>{document.systemVersion.version}</code>
            <span>历史版本</span>
            <code>{document.history.length} 个</code>
            <span>修改摘要</span>
            <code>{active.changeSummary || workflow.fallbackSummary}</code>
          </div>
          <div className={styles.inlineActions}>
            <Button icon={<HistoryOutlined />} onClick={() => openWorkflowAuditLogs(workflow)}>
              审计记录
            </Button>
            <Button icon={<UndoOutlined />} onClick={() => resetWorkflowDefault(workflow)}>
              重置默认
            </Button>
          </div>
          {document.history.length > 0 && (
            <div className={styles.workflowVersionList}>
              <h4>历史版本</h4>
              {document.history.map((version) => (
                <div key={version.id} className={styles.workflowVersionItem}>
                  <div>
                    <strong>{version.version}</strong>
                    <span>{formatWorkflowSource(version.source)} · {version.status}</span>
                    <small>{version.changeSummary || '无修改摘要'}</small>
                  </div>
                  {version.id !== active.id && (
                    <div className={styles.inlineActions}>
                      <Button onClick={() => openWorkflowDiff(workflow, active, version)}>
                        对比当前
                      </Button>
                      <Button onClick={() => activateWorkflowVersion(workflow, version)}>
                        启用
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <pre className={styles.workflowDoc}>{active.markdown}</pre>
        </div>,
        true,
        'large',
      )
    } catch (e) {
      openModal(
        workflow.label,
        <div className="note warning">{e instanceof Error ? e.message : '加载工作流文档失败'}</div>,
        true,
        'large',
      )
    }
  }

  const activateWorkflowVersion = async (workflow: WorkflowUiConfig, version: WorkflowVersion) => {
    openModal('启用工作流版本', <div className="note">正在启用 {workflow.label} 版本 {version.version}...</div>, true, 'large')
    try {
      await activateWorkflowVersionRequest(workflow.id, version.id)
      toast('工作流版本已启用')
      await openWorkflowDocument(workflow)
    } catch (e) {
      openModal(
        '启用工作流版本',
        <div className="note warning">{e instanceof Error ? e.message : '启用工作流版本失败'}</div>,
        true,
        'large',
      )
    }
  }

  const resetWorkflowDefault = async (workflow: WorkflowUiConfig) => {
    openModal('重置工作流', <div className="note">正在将 {workflow.label} 重置为系统默认版本...</div>, true, 'large')
    try {
      await resetWorkflowToSystemDefault(workflow.id)
      toast('已重置为系统默认工作流')
      await openWorkflowDocument(workflow)
    } catch (e) {
      openModal(
        '重置工作流',
        <div className="note warning">{e instanceof Error ? e.message : '重置工作流失败'}</div>,
        true,
        'large',
      )
    }
  }

  const openWorkflowAuditLogs = async (workflow: WorkflowUiConfig) => {
    openModal(`${workflow.label}审计记录`, <div className="note">正在加载审计记录…</div>, true, 'large')
    try {
      const result = await getWorkflowAuditLogs(workflow.id)
      openModal(
        `${workflow.label}审计记录`,
        <div className={styles.workflowAuditList}>
          {result.logs.length === 0 ? (
            <div className="note">暂无审计记录</div>
          ) : (
            result.logs.map((log) => (
              <div key={log.id} className={styles.workflowAuditItem}>
                <strong>{formatWorkflowAction(log.action)}</strong>
                <span>{log.actor} · {formatDateTime(log.createdAt)}</span>
                <small>{log.summary || '无摘要'}</small>
              </div>
            ))
          )}
        </div>,
        true,
        'large',
      )
    } catch (e) {
      openModal(
        `${workflow.label}审计记录`,
        <div className="note warning">{e instanceof Error ? e.message : '加载审计记录失败'}</div>,
        true,
        'large',
      )
    }
  }

  const openWorkflowDiff = async (workflow: WorkflowUiConfig, active: WorkflowVersion, version: WorkflowVersion) => {
    openModal('工作流版本对比', <div className="note">正在生成版本差异…</div>, true, 'large')
    try {
      const diff = await getWorkflowVersionDiff(workflow.id, version.id, active.id)
      openModal(
        `${workflow.label}版本对比 · ${active.version} → ${version.version}`,
        <div>
          <div className={styles.workflowMeta}>
            <span>新增</span>
            <code>{diff.summary.added} 行</code>
            <span>删除</span>
            <code>{diff.summary.removed} 行</code>
            <span>未变</span>
            <code>{diff.summary.unchanged} 行</code>
          </div>
          <pre className={styles.workflowDiff}>
            {diff.lines.map((line, index) => (
              <span key={`${index}-${line.type}`} className={styles[`diff_${line.type}`]}>
                {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                {line.text || ' '}
                {'\n'}
              </span>
            ))}
          </pre>
        </div>,
        true,
        'large',
      )
    } catch (e) {
      openModal(
        '工作流版本对比',
        <div className="note warning">{e instanceof Error ? e.message : '生成版本差异失败'}</div>,
        true,
        'large',
      )
    }
  }

  const openWorkflowDraftDialog = (workflow: WorkflowUiConfig = X_TREND_WORKFLOW) => {
    openModal(
      `与 AI 一起修改${workflow.label}`,
      <WorkflowDraftForm ref={workflowDraftRef} />,
      false,
      'large',
      {
        label: '生成草稿',
        onConfirm: async () => {
          const instruction = workflowDraftRef.current?.snapshot()
          if (!instruction) {
            toast('请输入你想调整的工作流要求')
            return
          }
          openModal(`与 AI 一起修改${workflow.label}`, <div className="note">正在生成工作流草稿…</div>, true, 'large')
          try {
            let draft = (await createWorkflowDraft(workflow.id, instruction)).draftVersion
            let repairCount = 0
            openModal(`与 AI 一起修改${workflow.label}`, <div className="note">草稿已生成，正在运行短流程测试…</div>, true, 'large')
            let testResult = await testWorkflowVersion(workflow.id, draft.id)
            while (testResult.status === 'failed' && repairCount < 2) {
              repairCount += 1
              openModal(
                `与 AI 一起修改${workflow.label}`,
                <div className="note">短流程测试失败，正在让 AI 修复第 {repairCount} 次...</div>,
                true,
                'large',
              )
              draft = (await repairWorkflowVersion(workflow.id, draft.id)).draftVersion
              testResult = await testWorkflowVersion(workflow.id, draft.id)
            }
            openModal(
              `${draft.title} · 草稿 ${draft.version}`,
              <div>
                <div className={styles.workflowMeta}>
                  <span>状态</span>
                  <code>{draft.status}</code>
                  <span>短流程测试</span>
                  <code>{formatWorkflowTestStatus(testResult.status)}{testResult.errorMessage ? `：${testResult.errorMessage}` : ''}</code>
                  <span>AI 自动修复</span>
                  <code>{repairCount} 次</code>
                  <span>来源</span>
                  <code>{formatWorkflowSource(draft.source)}</code>
                  <span>修改摘要</span>
                  <code>{draft.changeSummary || '未返回摘要'}</code>
                </div>
                {testResult.status === 'passed' && (
                  <div className={styles.inlineActions}>
                    <Button type="primary" onClick={() => activateWorkflowVersion(workflow, draft)}>
                      启用此版本
                    </Button>
                  </div>
                )}
                <pre className={styles.workflowDoc}>{draft.markdown}</pre>
              </div>,
              true,
              'large',
            )
            toast(testResult.status === 'passed' ? '工作流草稿已通过短流程测试，尚未启用' : '工作流草稿测试失败，尚未启用')
          } catch (e) {
            openModal(
              `与 AI 一起修改${workflow.label}`,
              <div className="note warning">{e instanceof Error ? e.message : '生成工作流草稿失败'}</div>,
              true,
              'large',
            )
          }
        },
      },
    )
  }

  if (loading) {
    return <section className={styles.settingPanel}><Spin tip="正在加载 Twitter 配置…" /></section>
  }

  if (error) {
    return <section className={styles.settingPanel}><Alert type="error" message={`加载失败：${error}`} showIcon /></section>
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>Twitter 配置</h2>
            <p className="small">X 热搜榜采集、榜单形成 Event 工作流、重点主题追踪。</p>
          </div>
          <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={regions.length === 0}>
            {saving ? '保存中…' : '保存配置'}
          </Button>
        </div>
      </div>

      <div className={styles.twitterGrid}>
        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>获取榜单的时间频率</h3>
              <p className="small">保存后由服务端同步到 X 榜单采集任务。</p>
            </div>
            <span className="pill green">{frequencyLabel}</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>采集频率</label>
              <Select
                value={frequencyMs}
                options={FREQUENCY_OPTIONS}
                onChange={setFrequencyMs}
              />
            </div>
            <div className="field">
              <label>榜单条数</label>
              <InputNumber
                min={1}
                max={30}
                value={Number(trendLimit)}
                onChange={(value) => setTrendLimit(String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div className={styles.regionList}>
            {REGION_OPTIONS.map((region) => (
              <Checkbox
                key={region}
                className={styles.checkItem}
                  checked={regions.includes(region)}
                  onChange={() => toggleRegion(region)}
              >
                {region}
              </Checkbox>
            ))}
          </div>
        </section>

        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>榜单形成事件的工作流</h3>
              <p className="small">采集成功形成快照后自动触发。</p>
            </div>
            <div className={styles.inlineActions}>
              <Button icon={<RobotOutlined />} onClick={() => openWorkflowDraftDialog(X_TREND_WORKFLOW)}>
                与 AI 一起修改
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => openWorkflowDocument(X_TREND_WORKFLOW)}>
                查看
              </Button>
            </div>
          </div>
        </section>

        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>重点主题追踪配置</h3>
              <p className="small">点击主题行配置语义、正反例、账号和主题圈工作流。</p>
            </div>
            <div className={styles.inlineActions}>
              <Button icon={<RobotOutlined />} onClick={() => openWorkflowDraftDialog(TOPIC_EVENT_WORKFLOW)}>
                与 AI 一起修改
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => openWorkflowDocument(TOPIC_EVENT_WORKFLOW)}>
                查看工作流
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => openTopicConfig()}>
                新增主题
              </Button>
            </div>
          </div>
          {topics.length === 0 ? (
            <Empty description="暂无重点主题配置" />
          ) : (
            topics.map((topic, index) => (
              <SettingRow
                key={topic.id}
                name={topic.name}
                desc={`${topic.keywords.length} 个关键词 / ${topic.accounts.length} 个关注账号`}
                status={topic.enabled ? '启用' : '停用'}
                middle={topic.workflowId}
                actionLabel="配置/修改"
                onEdit={() => openTopicConfig(topic, index)}
              />
            ))
          )}
        </section>
      </div>
    </section>
  )
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeTopicConfigs(config: PlatformCollectionConfig): TopicTrackingConfig[] {
  const configured = config.variables.topicConfigs
  if (configured?.length) {
    return configured.map((topic) => ({
      ...topic,
      keywords: topic.keywords ?? [],
      positiveExamples: topic.positiveExamples ?? [],
      negativeExamples: topic.negativeExamples ?? [],
      accounts: topic.accounts ?? [],
      action: topic.action || '立即自动响应',
      collectionFrequency: topic.collectionFrequency || '每 3 小时',
      workflowId: topic.workflowId || 'x-topic-circle-event-formation',
      defaultPostLimit: topic.defaultPostLimit ?? config.variables.defaultPostLimit ?? 30,
    }))
  }

  const hasLegacyTopic =
    (config.variables.topicKeywords?.length ?? 0) > 0 ||
    (config.variables.topicNegativeKeywords?.length ?? 0) > 0 ||
    (config.variables.monitoredAccounts?.length ?? 0) > 0

  if (!hasLegacyTopic) return []

  return [
    {
      id: 'topic-default',
      name: '默认重点主题',
      enabled: true,
      keywords: config.variables.topicKeywords ?? [],
      positiveExamples: [],
      negativeExamples: config.variables.topicNegativeKeywords ?? [],
      action: '立即自动响应',
      accounts: config.variables.monitoredAccounts ?? [],
      collectionFrequency: '每 3 小时',
      workflowId: 'x-topic-circle-event-formation',
      defaultPostLimit: config.variables.defaultPostLimit ?? 30,
    },
  ]
}

function flattenTopicConfigs(topics: TopicTrackingConfig[]) {
  const enabledTopics = topics.filter((topic) => topic.enabled)

  return {
    topicKeywords: unique(enabledTopics.flatMap((topic) => topic.keywords)),
    topicNegativeKeywords: unique(enabledTopics.flatMap((topic) => topic.negativeExamples)),
    monitoredAccounts: unique(enabledTopics.flatMap((topic) => topic.accounts)),
  }
}

function resolveTrendIntervalMs(config: PlatformCollectionConfig) {
  if (typeof config.variables.trendCollectionIntervalMs === 'number' && config.variables.trendCollectionIntervalMs > 0) {
    return config.variables.trendCollectionIntervalMs
  }
  const cron = config.variables.trendCollectionCron
  const legacyCron = FREQUENCY_OPTIONS.find((item) => cron === `0 */${item.value / 3600000} * * *`)
  return legacyCron?.value ?? 2 * 60 * 60 * 1000
}

function normalizeTrendLimit(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) return undefined
  return parsed
}

function formatWorkflowSource(source: string) {
  const labels: Record<string, string> = {
    system: '系统默认',
    ai_custom: 'AI 自定义',
    manual_import: '人工导入',
    rollback: '历史回滚',
  }
  return labels[source] ?? source
}

function formatWorkflowTestStatus(status: string) {
  const labels: Record<string, string> = {
    running: '测试中',
    passed: '通过',
    failed: '失败',
  }
  return labels[status] ?? status
}

function formatWorkflowAction(action: string) {
  const labels: Record<string, string> = {
    create_ai_draft: 'AI 生成草稿',
    repair_ai_draft: 'AI 修复草稿',
    run_short_test: '短流程测试',
    activate_version: '启用版本',
    reset_to_system_default: '重置默认',
  }
  return labels[action] ?? action
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

function createTopicId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')

  return `topic-${slug || 'custom'}-${Date.now()}`
}

interface TopicConfigFormHandle {
  snapshot: () => TopicTrackingConfig | null
}

interface WorkflowDraftFormHandle {
  snapshot: () => string | null
}

const WorkflowDraftForm = forwardRef<WorkflowDraftFormHandle>((_, ref) => {
  const [instruction, setInstruction] = useState('')

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const trimmed = instruction.trim()
      return trimmed ? trimmed : null
    },
  }))

  return (
    <div className={styles.topicForm}>
      <div className="field full">
        <label>修改要求</label>
        <Input.TextArea
          rows={6}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="例如：泛娱乐话题更严格一点；监管、产品发布、重大资金流动更积极形成事件；重复事件优先合并。"
        />
      </div>
      <Alert message="生成结果会保存为草稿版本，不会覆盖系统默认工作流，也不会自动启用。" showIcon />
    </div>
  )
})

WorkflowDraftForm.displayName = 'WorkflowDraftForm'

const TopicConfigForm = forwardRef<
  TopicConfigFormHandle,
  {
    topic?: TopicTrackingConfig
    defaultPostLimit: number
  }
>(({ topic, defaultPostLimit }, ref) => {
  const [name, setName] = useState(topic?.name ?? '')
  const [enabled, setEnabled] = useState(topic?.enabled ?? true)
  const [keywords, setKeywords] = useState((topic?.keywords ?? []).join('\n'))
  const [positiveExamples, setPositiveExamples] = useState((topic?.positiveExamples ?? []).join('\n'))
  const [negativeExamples, setNegativeExamples] = useState((topic?.negativeExamples ?? []).join('\n'))
  const [accounts, setAccounts] = useState<string[]>(topic?.accounts?.length ? topic.accounts : [''])
  const [postLimit, setPostLimit] = useState(String(topic?.defaultPostLimit ?? defaultPostLimit))

  useImperativeHandle(
    ref,
    () => ({
      snapshot: () => {
        const trimmedName = name.trim()
        if (!trimmedName) return null

        return {
          id: topic?.id ?? createTopicId(trimmedName),
          name: trimmedName,
          enabled,
          keywords: lines(keywords),
          positiveExamples: lines(positiveExamples),
          negativeExamples: lines(negativeExamples),
          action: topic?.action ?? '立即自动响应',
          accounts: accounts.map((account) => account.trim()).filter(Boolean),
          collectionFrequency: topic?.collectionFrequency ?? '每 3 小时',
          workflowId: topic?.workflowId ?? 'x-topic-circle-event-formation',
          defaultPostLimit: Number(postLimit) || defaultPostLimit,
        }
      },
    }),
    [
      accounts,
      defaultPostLimit,
      enabled,
      keywords,
      name,
      negativeExamples,
      positiveExamples,
      postLimit,
      topic,
    ],
  )

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>主题名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>启用状态</label>
          <Select
            value={enabled ? '启用' : '停用'}
            options={[
              { value: '启用', label: '启用' },
              { value: '停用', label: '停用' },
            ]}
            onChange={(value) => setEnabled(value === '启用')}
          />
        </div>
        <div className="field">
          <label>语义关键词</label>
          <Input.TextArea value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>
        <div className="field">
          <label>正例 Event</label>
          <Input.TextArea value={positiveExamples} onChange={(e) => setPositiveExamples(e.target.value)} />
        </div>
        <div className="field">
          <label>反例 Event</label>
          <Input.TextArea value={negativeExamples} onChange={(e) => setNegativeExamples(e.target.value)} />
        </div>
        <div className="field">
          <label>单次帖子上限</label>
          <InputNumber min={1} value={Number(postLimit)} onChange={(value) => setPostLimit(String(value ?? ''))} style={{ width: '100%' }} />
        </div>
        <AccountListInput value={accounts} onChange={setAccounts} />
      </div>
      <Alert
        style={{ marginTop: 12 }}
        message="保存影响"
        description="保存后会更新 Twitter 平台变量；榜单语义命中和主题圈账号追踪会读取这些字段。"
        showIcon
      />
    </div>
  )
})

function AccountListInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const update = (index: number, account: string) => {
    onChange(value.map((item, i) => (i === index ? account : item)))
  }

  const add = () => onChange([...value, ''])

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next.length ? next : [''])
  }

  return (
    <div className="field">
      <label>关注账号</label>
      <div>
        {value.map((account, index) => (
          <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <Input
              value={account}
              onChange={(e) => update(index, e.target.value)}
              placeholder="@handle"
              style={{ flex: 1 }}
            />
            <Button onClick={() => remove(index)}>
              ×
            </Button>
          </div>
        ))}
        <Button icon={<PlusOutlined />} onClick={add}>
          + 添加账号
        </Button>
      </div>
    </div>
  )
}
