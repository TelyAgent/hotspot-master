import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Checkbox, Select, Spin, Switch } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

const REGION_OPTIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']

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
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequencyMs, setFrequencyMs] = useState(3 * 60 * 60 * 1000)
  const [trendLimit, setTrendLimit] = useState(30)
  const [trendCollectionEnabled, setTrendCollectionEnabled] = useState(true)

  const frequencyLabel = useMemo(() => formatIntervalMs(frequencyMs), [frequencyMs])
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
  } = {}) => {
    if (!config) return null
    const nextLimit = normalizeTrendLimit(trendLimit)
    if (!nextLimit) {
      toast('榜单条数请输入 1-30 之间的整数')
      return null
    }

    const nextConfig = await updatePlatformCollectionConfig('x', {
      defaultRegions: regions,
      variables: {
        ...config.variables,
        regions,
        defaultTrendLimit: nextLimit,
        trendCollectionIntervalMs: frequencyMs,
        trendCollectionEnabled: patch.trendCollectionEnabled ?? trendCollectionEnabled,
      },
    })

    setConfig(nextConfig)
    setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
    setFrequencyMs(resolveTrendIntervalMs(nextConfig))
    setTrendLimit(nextConfig.variables.defaultTrendLimit ?? 30)
    setTrendCollectionEnabled(nextConfig.variables.trendCollectionEnabled ?? nextConfig.enabled)
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
            <p className="small">X 热搜榜采集和榜单形成 Event 工作流。</p>
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
