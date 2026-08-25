import { useEffect } from 'react'
import { Tabs } from 'antd'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useTrending } from '../../hooks/useTrending'
import { useTrendRegions } from '../../hooks/useTrendRegions'
import Ranking from './Ranking'
import Topics from './Topics'
import styles from './Monitor.module.css'

const SUBTABS = [
  ['ranking', '热搜排行榜'],
  ['topics', '重点主题追踪'],
] as const

function formatCollectedAt(iso?: string): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function Monitor() {
  const { mt, set, region } = useApp()
  const trendRegions = useTrendRegions()
  const { data, loading, error, reload } = useTrending(region)

  useEffect(() => {
    if (!trendRegions.loading && trendRegions.regions.length > 0 && !trendRegions.regions.includes(region)) {
      set({ region: trendRegions.regions[0] })
    }
  }, [region, set, trendRegions.loading, trendRegions.regions])

  return (
    <>
      <Head
        title="热点监测"
        desc="完整呈现和聚合各地区排行榜；是否进入响应由事件库承接。"
      />
      <Tabs
        className={styles.subtabs}
        activeKey={mt}
        items={SUBTABS.map(([key, label]) => ({ key, label }))}
        onChange={(key) => set({ mt: key })}
      />
      {mt === 'ranking' ? (
        <Ranking
          data={data}
          loading={loading || trendRegions.loading}
          error={error ?? trendRegions.error}
          regions={trendRegions.regions}
          collectedLabel={formatCollectedAt(data?.collectedAt)}
          isMock={data?.source === 'mock'}
          onReload={reload}
        />
      ) : mt === 'topics' ? (
        <Topics />
      ) : (
        <Ranking
          data={data}
          loading={loading || trendRegions.loading}
          error={error ?? trendRegions.error}
          regions={trendRegions.regions}
          collectedLabel={formatCollectedAt(data?.collectedAt)}
          isMock={data?.source === 'mock'}
          onReload={reload}
        />
      )}
    </>
  )
}
