import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Checkbox, Input, Select, Spin, Switch, Tag } from 'antd'
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type KolRadarAccount,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

const REGION_OPTIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']
const DEFAULT_KOL_INTERVAL_MS = 6 * 60 * 60 * 1000

const FREQUENCY_OPTIONS = [
  { label: '每 1 小时', value: 60 * 60 * 1000 },
  { label: '每 2 小时', value: 2 * 60 * 60 * 1000 },
  { label: '每 3 小时', value: 3 * 60 * 60 * 1000 },
  { label: '每 4 小时', value: 4 * 60 * 60 * 1000 },
  { label: '每 6 小时', value: 6 * 60 * 60 * 1000 },
]

export default function TwitterSetting() {
  const { toast } = useApp()
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTrendToggle, setSavingTrendToggle] = useState(false)
  const [savingKolToggle, setSavingKolToggle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequencyMs, setFrequencyMs] = useState(3 * 60 * 60 * 1000)
  const [trendLimit, setTrendLimit] = useState(30)
  const [trendCollectionEnabled, setTrendCollectionEnabled] = useState(true)
  const [kolRadarEnabled, setKolRadarEnabled] = useState(true)
  const [kolAccounts, setKolAccounts] = useState<KolRadarAccount[]>([])

  const frequencyLabel = useMemo(() => formatIntervalMs(frequencyMs), [frequencyMs])
  const kolRadarLabel = useMemo(
    () => formatIntervalMs(config?.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS),
    [config],
  )
  const frequencyOptions = useMemo(() => {
    if (FREQUENCY_OPTIONS.some((item) => item.value === frequencyMs)) {
      return FREQUENCY_OPTIONS
    }

    return [
      ...FREQUENCY_OPTIONS,
      {
        label: formatIntervalMs(frequencyMs),
        value: frequencyMs,
      },
    ]
  }, [frequencyMs])

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
        setTrendLimit(nextConfig.variables.defaultTrendLimit ?? 30)
        setTrendCollectionEnabled(nextConfig.variables.trendCollectionEnabled ?? nextConfig.enabled)
        setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
        setKolAccounts(nextConfig.variables.kolAccounts ?? [])
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

  const persist = async (patch: {
    trendCollectionEnabled?: boolean
    kolRadarEnabled?: boolean
    kolAccounts?: KolRadarAccount[]
  } = {}) => {
    if (!config) return null
    const nextLimit = normalizeTrendLimit(trendLimit)
    if (!nextLimit) {
      toast('榜单条数请输入 1-30 之间的整数')
      return null
    }

    const nextKolAccounts = patch.kolAccounts ?? kolAccounts
    const nextConfig = await updatePlatformCollectionConfig('x', {
      defaultRegions: regions,
      variables: {
        ...config.variables,
        regions,
        defaultTrendLimit: nextLimit,
        trendCollectionIntervalMs: frequencyMs,
        trendCollectionEnabled: patch.trendCollectionEnabled ?? trendCollectionEnabled,
        kolRadarEnabled: patch.kolRadarEnabled ?? kolRadarEnabled,
        kolRadarCollectionIntervalMs:
          config.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS,
        kolAccounts: nextKolAccounts,
        monitoredAccounts: nextKolAccounts.filter((item) => item.enabled).map((item) => item.handle),
      },
    })

    setConfig(nextConfig)
    setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
    setFrequencyMs(resolveTrendIntervalMs(nextConfig))
    setTrendLimit(nextConfig.variables.defaultTrendLimit ?? 30)
    setTrendCollectionEnabled(nextConfig.variables.trendCollectionEnabled ?? nextConfig.enabled)
    setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
    setKolAccounts(nextConfig.variables.kolAccounts ?? [])
    return nextConfig
  }

  const handleTrendCollectionSwitch = async (checked: boolean) => {
    const previous = trendCollectionEnabled
    setTrendCollectionEnabled(checked)
    setSavingTrendToggle(true)
    try {
      await persist({ trendCollectionEnabled: checked })
      toast(checked ? 'X 热榜定时采集已开启' : 'X 热榜定时采集已关闭')
    } catch (e) {
      setTrendCollectionEnabled(previous)
      toast(e instanceof Error ? e.message : '保存 X 热榜定时采集开关失败')
    } finally {
      setSavingTrendToggle(false)
    }
  }

  const handleKolRadarSwitch = async (checked: boolean) => {
    const previous = kolRadarEnabled
    setKolRadarEnabled(checked)
    setSavingKolToggle(true)
    try {
      await persist({ kolRadarEnabled: checked })
      toast(checked ? 'KOL 雷达定时采集已开启' : 'KOL 雷达定时采集已关闭')
    } catch (e) {
      setKolRadarEnabled(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 雷达定时采集开关失败')
    } finally {
      setSavingKolToggle(false)
    }
  }

  const handleKolAccountSwitch = async (index: number, checked: boolean) => {
    const previous = kolAccounts
    const nextAccounts = kolAccounts.map((item, currentIndex) =>
      currentIndex === index ? { ...item, enabled: checked } : item,
    )
    setKolAccounts(nextAccounts)
    setSavingKolToggle(true)
    try {
      await persist({ kolAccounts: nextAccounts })
      toast(`KOL 账号 ${nextAccounts[index]?.handle ?? ''} 已${checked ? '启用' : '停用'}`)
    } catch (e) {
      setKolAccounts(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 账号状态失败')
    } finally {
      setSavingKolToggle(false)
    }
  }

  const handleKolAccountUpdate = (index: number, patch: Partial<KolRadarAccount>) => {
    setKolAccounts((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    )
  }

  const handleAddKolAccount = () => {
    setKolAccounts((prev) => [
      ...prev,
      {
        handle: '',
        groupTag: null,
        joinedAt: new Date().toISOString(),
        enabled: true,
      },
    ])
  }

  const handleRemoveKolAccount = (index: number) => {
    setKolAccounts((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await persist()
      toast('Twitter 配置已保存')
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存 Twitter 配置失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.settingPanel}>
        <Spin tip="正在加载 Twitter 配置…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.settingPanel}>
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      </section>
    )
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingHero}>
        <div className={styles.settingHeroContent}>
          <div>
            <h2>Twitter 配置</h2>
            <p className="small">X 热搜榜采集、KOL 雷达采集和榜单形成 Event 工作流。</p>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            loading={saving}
            disabled={regions.length === 0}
          >
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
            <span className={styles.statusBadge}>{frequencyLabel}</span>
          </div>

          <div className={styles.settingControls}>
            <div className={styles.switchRow}>
              <div>
                <strong>定时采集</strong>
                <span>关闭后只保留手动采集入口。</span>
              </div>
              <Switch
                checked={trendCollectionEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                loading={savingTrendToggle}
                onChange={handleTrendCollectionSwitch}
              />
            </div>
            <div className={styles.controlRow}>
              <div className="field">
                <label>采集频率</label>
                <Select
                  showSearch
                  value={frequencyMs}
                  options={frequencyOptions}
                  placeholder="选择或输入小时数"
                  onChange={(value) => setFrequencyMs(Number(value))}
                  onSearch={(value) => {
                    const nextMs = parseIntervalInput(value)
                    if (nextMs) setFrequencyMs(nextMs)
                  }}
                />
              </div>
              <div className="field">
                <label>榜单条数</label>
                <Select
                  value={trendLimit}
                  options={[10, 20, 30].map((item) => ({ label: String(item), value: item }))}
                  onChange={(value) => setTrendLimit(Number(value))}
                />
              </div>
            </div>
          </div>

          <div className={styles.regionHeader}>采集地区</div>
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
              <h3>KOL 人驱动热点雷达</h3>
              <p className="small">
                仅采集已启用账号最近 6 小时帖子，不按赛道检索，不做市场倒推。
              </p>
            </div>
            <span className={styles.statusBadge}>{kolRadarLabel}</span>
          </div>

          <div className={styles.settingControls}>
            <div className={styles.switchRow}>
              <div>
                <strong>定时采集</strong>
                <span>关闭后只保留手动采集入口。</span>
              </div>
              <Switch
                checked={kolRadarEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                loading={savingKolToggle}
                onChange={handleKolRadarSwitch}
              />
            </div>
          </div>

          <div className={styles.regionHeader}>已选账号（{kolAccounts.length}）</div>
          <div className={styles.inlineActions}>
            <Button icon={<PlusOutlined />} onClick={handleAddKolAccount}>
              添加账号
            </Button>
          </div>
          <div className={styles.kolAccountList}>
            {kolAccounts.map((account, index) => (
              <div className={styles.kolAccountRow} key={`${account.joinedAt}-${index}`}>
                <div className={styles.kolAccountInfo}>
                  <div className={styles.kolAccountEditors}>
                    <Input
                      className={styles.kolAccountField}
                      placeholder="输入 handle"
                      value={account.handle}
                      onChange={(event) =>
                        handleKolAccountUpdate(index, { handle: event.target.value })
                      }
                    />
                    <Input
                      className={styles.kolAccountField}
                      placeholder="分组标签（可选）"
                      value={account.groupTag ?? ''}
                      onChange={(event) =>
                        handleKolAccountUpdate(index, {
                          groupTag: event.target.value ? event.target.value : null,
                        })
                      }
                    />
                  </div>
                  <div className={styles.kolAccountMeta}>
                    {account.groupTag ? <Tag color="blue">{account.groupTag}</Tag> : <Tag>未分组</Tag>}
                    <span>加入 {formatJoinedAt(account.joinedAt)}</span>
                  </div>
                </div>
                <div className={styles.kolAccountActions}>
                  <Switch
                    checked={account.enabled}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                    loading={savingKolToggle}
                    onChange={(checked) => void handleKolAccountSwitch(index, checked)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveKolAccount(index)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="采集规则"
            description="只从 KOL list 内账号取数，按最近 6 小时滚动窗口采集，默认按 views 从高到低排序。"
          />
        </section>
      </div>
    </section>
  )
}

function resolveTrendIntervalMs(config: PlatformCollectionConfig) {
  if (
    typeof config.variables.trendCollectionIntervalMs === 'number' &&
    config.variables.trendCollectionIntervalMs > 0
  ) {
    return config.variables.trendCollectionIntervalMs
  }
  return 3 * 60 * 60 * 1000
}

function normalizeTrendLimit(value: number) {
  return Number.isFinite(value) && value >= 1 && value <= 30 ? Math.trunc(value) : null
}

function parseIntervalInput(value: string) {
  const input = value.trim()
  if (!input) return null

  const hourMatch = input.match(/^(\d+(?:\.\d+)?)\s*(h|小时)$/i)
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60 * 60 * 1000)
  }

  const minuteMatch = input.match(/^(\d+(?:\.\d+)?)\s*(m|分钟)$/i)
  if (minuteMatch) {
    return Math.round(Number(minuteMatch[1]) * 60 * 1000)
  }

  return null
}

function formatIntervalMs(ms: number) {
  if (ms % (60 * 60 * 1000) === 0) {
    return `每 ${ms / (60 * 60 * 1000)} 小时`
  }
  if (ms % (60 * 1000) === 0) {
    return `每 ${ms / (60 * 1000)} 分钟`
  }
  return `${ms}ms`
}

function formatJoinedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
