import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Collapse, Empty, Input, InputNumber, Select, Spin, Tag } from 'antd'
import { EyeOutlined, HistoryOutlined, RobotOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import {
  getTopicWatchConfigs,
  updateActiveTopicMonitoringPlan,
  updateTopicWatchConfig,
  type TopicMonitoringPlanConfig,
  type TopicWatchConfig,
} from '../../../api/topicWatchConfig'
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
  const { openModal, toast } = useApp()
  const topicWatchFormRef = useRef<TopicWatchEditFormHandle>(null)
  const workflowDraftRef = useRef<WorkflowDraftFormHandle>(null)
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequencyMs, setFrequencyMs] = useState(2 * 60 * 60 * 1000)
  const [trendLimit, setTrendLimit] = useState('30')
  const [workflowId, setWorkflowId] = useState('x-trend-event-formation')
  const [topicWatches, setTopicWatches] = useState<TopicWatchConfig[]>([])

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
        const [nextConfig, nextTopicWatches] = await Promise.all([
          getPlatformCollectionConfig('x'),
          getTopicWatchConfigs(),
        ])
        if (!mounted) return
        setConfig(nextConfig)
        setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
        setFrequencyMs(resolveTrendIntervalMs(nextConfig))
        setTrendLimit(String(nextConfig.variables.defaultTrendLimit ?? 30))
        setWorkflowId(nextConfig.variables.trendEventWorkflowId ?? 'x-trend-event-formation')
        setTopicWatches(nextTopicWatches)
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
      const nextVariables = {
        ...config.variables,
        regions,
        defaultTrendLimit: nextTrendLimit,
        trendCollectionIntervalMs: frequencyMs,
        trendEventWorkflowId: workflowId,
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

  const reloadTopicWatches = async () => {
    setTopicWatches(await getTopicWatchConfigs())
  }

  const openTopicWatchEditor = (topic: TopicWatchConfig) => {
    openModal(
      `编辑重点主题 · ${topic.name}`,
      <TopicWatchEditForm ref={topicWatchFormRef} topic={topic} />,
      false,
      'large',
      {
        label: '保存',
        onConfirm: async () => {
          const snapshot = topicWatchFormRef.current?.snapshot()
          if (!snapshot) {
            toast('请输入主题名称')
            return
          }
          openModal(`编辑重点主题 · ${topic.name}`, <div className="note">正在保存重点主题配置…</div>, true, 'large')
          try {
            await updateTopicWatchConfig(topic.id, snapshot.topic)
            await updateActiveTopicMonitoringPlan(topic.id, snapshot.plan)
            await reloadTopicWatches()
            toast('重点主题配置已保存')
          } catch (e) {
            openModal(
              `编辑重点主题 · ${topic.name}`,
              <div className="note warning">{e instanceof Error ? e.message : '保存重点主题配置失败'}</div>,
              true,
              'large',
            )
          }
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
              <p className="small">沿用旧版主题圈配置；账号、规则和证据要求来自 v2 TopicWatch 监控计划。</p>
            </div>
            <div className={styles.inlineActions}>
              <Button icon={<RobotOutlined />} onClick={() => openWorkflowDraftDialog(TOPIC_EVENT_WORKFLOW)}>
                与 AI 一起修改
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => openWorkflowDocument(TOPIC_EVENT_WORKFLOW)}>
                查看工作流
              </Button>
            </div>
          </div>
          {topicWatches.length === 0 ? (
            <Empty description="暂无重点主题配置" />
          ) : (
            <Collapse
              className={styles.topicWatchCollapse}
              items={topicWatches.map((topic) => ({
                key: topic.id,
                label: <TopicWatchLabel topic={topic} />,
                extra: (
                  <div className={styles.inlineActions} onClick={(event) => event.stopPropagation()}>
                    <Button size="small" onClick={() => openTopicWatchEditor(topic)}>
                      编辑
                    </Button>
                  </div>
                ),
                children: <TopicWatchDetail topic={topic} />,
              }))}
            />
          )}
        </section>

      </div>
    </section>
  )
}

function TopicWatchLabel({ topic }: { topic: TopicWatchConfig }) {
  const plan = topic.monitoringPlans?.[0]
  const accountCount = getTopicAccounts(topic).length
  const refreshText = formatRefreshPolicy(plan?.refreshPolicy)

  return (
    <div className={styles.topicWatchLabel}>
      <div>
        <strong>{topic.name}</strong>
        <span>{topic.description || topic.watchIntent}</span>
      </div>
      <div className={styles.topicWatchMeta}>
        <Tag color={topic.status === 'active' ? 'success' : 'default'}>
          {topic.status === 'active' ? '启用' : topic.status}
        </Tag>
        <span>{accountCount} 个账号</span>
        <span>{refreshText}</span>
      </div>
    </div>
  )
}

function TopicWatchDetail({ topic }: { topic: TopicWatchConfig }) {
  const plan = topic.monitoringPlans?.[0]
  const accounts = getTopicAccounts(topic)
  const triggerRules = plan?.triggerRules ?? []
  const evidenceRequirements = plan?.evidenceRequirements ?? []

  return (
    <div className={styles.topicWatchDetail}>
      <div className={styles.topicWatchInfoGrid}>
        <div>
          <span className="small">监控意图</span>
          <p>{topic.watchIntent || '—'}</p>
        </div>
        <div>
          <span className="small">采集策略</span>
          <p>{topic.collectionPolicy || '—'}</p>
        </div>
        <div>
          <span className="small">触发策略</span>
          <p>{topic.triggerPolicy || '—'}</p>
        </div>
        <div>
          <span className="small">排除规则</span>
          <p>{topic.exclusionPolicy || '—'}</p>
        </div>
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>监控账号</h4>
        <div className={styles.topicAccountTags}>
          {accounts.length === 0 ? (
            <span className="small">暂无账号</span>
          ) : (
            accounts.map((account) => <Tag key={account}>@{account}</Tag>)
          )}
        </div>
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>触发规则</h4>
        {triggerRules.length === 0 ? (
          <p className="small">暂无触发规则</p>
        ) : (
          triggerRules.map((rule, index) => (
            <div key={rule.ruleId ?? index} className={styles.topicRuleItem}>
              <strong>{rule.ruleId ?? `rule-${index + 1}`}</strong>
              <span>{rule.description ?? '—'}</span>
              {rule.positiveExamples?.length ? (
                <small>正例：{rule.positiveExamples.join('；')}</small>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>证据要求</h4>
        {evidenceRequirements.length === 0 ? (
          <p className="small">暂无证据要求</p>
        ) : (
          evidenceRequirements.map((item, index) => (
            <div key={`${item.sourceType ?? 'source'}-${index}`} className={styles.topicRuleItem}>
              <strong>{item.sourceType ?? '未知来源'}</strong>
              <span>{item.requiredFields?.length ? item.requiredFields.join('、') : '未限定字段'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getTopicAccounts(topic: TopicWatchConfig) {
  const sources = topic.monitoringPlans?.[0]?.sources ?? []
  return sources
    .filter((source) => source.platform === 'x' && source.sourceType === 'account' && source.handle)
    .map((source) => String(source.handle).replace(/^@/, ''))
}

function formatRefreshPolicy(policy: TopicMonitoringPlanConfig['refreshPolicy']) {
  if (!policy) return '未配置频率'
  const interval = typeof policy.intervalMinutes === 'number' ? policy.intervalMinutes : undefined
  const lookback = typeof policy.lookbackMinutes === 'number' ? policy.lookbackMinutes : undefined
  if (interval && lookback) return `每 ${formatMinutes(interval)} / 回看 ${formatMinutes(lookback)}`
  if (interval) return `每 ${formatMinutes(interval)}`
  if (lookback) return `回看 ${formatMinutes(lookback)}`
  return '已配置刷新策略'
}

function formatMinutes(value: number) {
  if (value % 60 === 0) return `${value / 60} 小时`
  return `${value} 分钟`
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

interface WorkflowDraftFormHandle {
  snapshot: () => string | null
}

interface TopicWatchEditFormHandle {
  snapshot: () => null | {
    topic: Parameters<typeof updateTopicWatchConfig>[1]
    plan: Parameters<typeof updateActiveTopicMonitoringPlan>[1]
  }
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

const TopicWatchEditForm = forwardRef<
  TopicWatchEditFormHandle,
  { topic: TopicWatchConfig }
>(({ topic }, ref) => {
  const plan = topic.monitoringPlans?.[0]
  const [name, setName] = useState(topic.name)
  const [description, setDescription] = useState(topic.description)
  const [status, setStatus] = useState(topic.status)
  const [watchIntent, setWatchIntent] = useState(topic.watchIntent)
  const [collectionPolicy, setCollectionPolicy] = useState(topic.collectionPolicy)
  const [triggerPolicy, setTriggerPolicy] = useState(topic.triggerPolicy)
  const [evidencePolicy, setEvidencePolicy] = useState(topic.evidencePolicy)
  const [exclusionPolicy, setExclusionPolicy] = useState(topic.exclusionPolicy ?? '')
  const [domains, setDomains] = useState(topic.domains.join('\n'))
  const [accounts, setAccounts] = useState(getTopicAccounts(topic).join('\n'))
  const [intervalMinutes, setIntervalMinutes] = useState(plan?.refreshPolicy?.intervalMinutes ?? 180)
  const [lookbackMinutes, setLookbackMinutes] = useState(plan?.refreshPolicy?.lookbackMinutes ?? 180)
  const [triggerRules, setTriggerRules] = useState(formatTriggerRules(plan?.triggerRules ?? []))
  const [evidenceRequirements, setEvidenceRequirements] = useState(formatEvidenceRequirements(plan?.evidenceRequirements ?? []))

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const trimmedName = name.trim()
      if (!trimmedName) return null
      const handles = textLines(accounts)

      return {
        topic: {
          name: trimmedName,
          description: description.trim(),
          domains: textLines(domains),
          watchIntent: watchIntent.trim(),
          collectionPolicy: collectionPolicy.trim(),
          triggerPolicy: triggerPolicy.trim(),
          evidencePolicy: evidencePolicy.trim(),
          exclusionPolicy: exclusionPolicy.trim() || null,
          status,
        },
        plan: {
          sources: handles.map((handle) => ({
            platform: 'x',
            sourceType: 'account',
            handle: handle.replace(/^@/, ''),
            includeReplies: true,
            includeQuotes: true,
            includeReposts: false,
            maxPages: 5,
          })),
          refreshPolicy: {
            ...(plan?.refreshPolicy ?? {}),
            intervalMinutes,
            lookbackMinutes,
          },
          triggerRules: parseTriggerRules(triggerRules),
          evidenceRequirements: parseEvidenceRequirements(evidenceRequirements),
          reason: '运营人员在 Twitter 配置页手动修改重点主题配置。',
        },
      }
    },
  }), [
    accounts,
    collectionPolicy,
    description,
    domains,
    evidencePolicy,
    evidenceRequirements,
    exclusionPolicy,
    intervalMinutes,
    lookbackMinutes,
    name,
    plan?.refreshPolicy,
    status,
    triggerPolicy,
    triggerRules,
    watchIntent,
  ])

  return (
    <div className={styles.topicForm}>
      <div className="form-grid">
        <div className="field">
          <label>主题名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>状态</label>
          <Select
            value={status}
            options={[
              { value: 'active', label: '启用' },
              { value: 'paused', label: '停用' },
            ]}
            onChange={setStatus}
          />
        </div>
        <div className="field">
          <label>描述</label>
          <Input.TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>领域/关键词</label>
          <Input.TextArea rows={3} value={domains} onChange={(e) => setDomains(e.target.value)} />
        </div>
        <div className="field">
          <label>监控意图</label>
          <Input.TextArea rows={3} value={watchIntent} onChange={(e) => setWatchIntent(e.target.value)} />
        </div>
        <div className="field">
          <label>采集策略</label>
          <Input.TextArea rows={3} value={collectionPolicy} onChange={(e) => setCollectionPolicy(e.target.value)} />
        </div>
        <div className="field">
          <label>触发策略</label>
          <Input.TextArea rows={3} value={triggerPolicy} onChange={(e) => setTriggerPolicy(e.target.value)} />
        </div>
        <div className="field">
          <label>证据策略</label>
          <Input.TextArea rows={3} value={evidencePolicy} onChange={(e) => setEvidencePolicy(e.target.value)} />
        </div>
        <div className="field">
          <label>排除规则</label>
          <Input.TextArea rows={3} value={exclusionPolicy} onChange={(e) => setExclusionPolicy(e.target.value)} />
        </div>
        <div className="field">
          <label>监控账号</label>
          <Input.TextArea rows={6} value={accounts} onChange={(e) => setAccounts(e.target.value)} placeholder="@OpenAI&#10;@TechCrunch" />
        </div>
        <div className="field">
          <label>采集间隔（分钟）</label>
          <InputNumber min={10} value={intervalMinutes} onChange={(value) => setIntervalMinutes(Number(value ?? 180))} style={{ width: '100%' }} />
        </div>
        <div className="field">
          <label>回看窗口（分钟）</label>
          <InputNumber min={10} value={lookbackMinutes} onChange={(value) => setLookbackMinutes(Number(value ?? 180))} style={{ width: '100%' }} />
        </div>
        <div className="field">
          <label>触发规则</label>
          <Input.TextArea rows={5} value={triggerRules} onChange={(e) => setTriggerRules(e.target.value)} />
        </div>
        <div className="field">
          <label>证据要求</label>
          <Input.TextArea rows={5} value={evidenceRequirements} onChange={(e) => setEvidenceRequirements(e.target.value)} />
        </div>
      </div>
      <Alert message="保存后会更新当前 active 监控计划；不会创建新版本。" showIcon />
    </div>
  )
})

TopicWatchEditForm.displayName = 'TopicWatchEditForm'

function textLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatTriggerRules(rules: NonNullable<TopicMonitoringPlanConfig['triggerRules']>) {
  return rules
    .map((rule) => {
      const examples = rule.positiveExamples?.length ? ` | 正例：${rule.positiveExamples.join('；')}` : ''
      return `${rule.ruleId ?? 'rule'} | ${rule.description ?? ''}${examples}`
    })
    .join('\n')
}

function parseTriggerRules(value: string) {
  return textLines(value).map((line, index) => {
    const [ruleId, description = '', examples = ''] = line.split('|').map((item) => item.trim())
    return {
      ruleId: ruleId || `rule-${index + 1}`,
      description,
      positiveExamples: examples.replace(/^正例：/, '').split('；').map((item) => item.trim()).filter(Boolean),
    }
  })
}

function formatEvidenceRequirements(requirements: NonNullable<TopicMonitoringPlanConfig['evidenceRequirements']>) {
  return requirements
    .map((item) => `${item.sourceType ?? 'x_account_post'} | ${(item.requiredFields ?? []).join('、')}`)
    .join('\n')
}

function parseEvidenceRequirements(value: string) {
  return textLines(value).map((line) => {
    const [sourceType, fields = ''] = line.split('|').map((item) => item.trim())
    return {
      sourceType: sourceType || 'x_account_post',
      requiredFields: fields.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
    }
  })
}
