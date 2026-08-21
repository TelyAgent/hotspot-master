import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { refreshMonitor } from '../../api/monitor'
import { useTrending } from '../../hooks/useTrending'
import { useTrendRegions } from '../../hooks/useTrendRegions'
import Ranking from './Ranking'
import Topics from './Topics'
import Regions from './Regions'
import HotContent from './HotContent'
import styles from './Monitor.module.css'

const SUBTABS: [string, string][] = [
  ['ranking', '热搜排行榜'],
  ['topics', '重点主题追踪'],
  ['regions', '跨区聚合'],
  ['content', '热点内容'],
]

function formatCollectedAt(iso?: string): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function Monitor() {
  const { mt, toast, set, region } = useApp()
  const trendRegions = useTrendRegions()
  const { data, loading, error, reload } = useTrending(region)

  useEffect(() => {
    if (!trendRegions.loading && trendRegions.regions.length > 0 && !trendRegions.regions.includes(region)) {
      set({ region: trendRegions.regions[0] })
    }
  }, [region, set, trendRegions.loading, trendRegions.regions])

  const handleRefresh = () => {
    toast('已发起五个榜单的立即采集')
    refreshMonitor()
      .then((result) => {
        if (result.status === 'failed') {
          toast(result.error ? `采集失败：${result.error}` : '采集失败')
          return
        }

        toast(result.message)
        reload()
      })
      .catch((error: unknown) => {
        toast(error instanceof Error ? error.message : '采集请求失败')
      })
  }

  return (
    <>
      <Head
        title="热点监测"
        desc="完整呈现和聚合各地区排行榜；是否进入响应由事件库承接。"
        actions={
          <>
            <button className="btn">
              最近成功采集 {formatCollectedAt(data?.collectedAt)}
              {data?.source === 'mock' ? '（模拟）' : ''}
            </button>
            <button className="btn primary" onClick={handleRefresh}>
              立即采集
            </button>
          </>
        }
      />
      <div className={styles.subtabs}>
        {SUBTABS.map(([key, label]) => (
          <button
            key={key}
            className={`${styles.subtab} ${mt === key ? styles.active : ''}`}
            onClick={() => set({ mt: key })}
          >
            {label}
          </button>
        ))}
      </div>
      {mt === 'ranking' ? (
        <Ranking
          data={data}
          loading={loading || trendRegions.loading}
          error={error ?? trendRegions.error}
          regions={trendRegions.regions}
        />
      ) : mt === 'topics' ? (
        <Topics />
      ) : mt === 'regions' ? (
        <Regions />
      ) : (
        <HotContent />
      )}
    </>
  )
}
