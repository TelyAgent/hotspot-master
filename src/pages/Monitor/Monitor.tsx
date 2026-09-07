import { useEffect, useState } from 'react'
import { Tabs } from 'antd'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useTrending } from '../../hooks/useTrending'
import { useTrendRegions } from '../../hooks/useTrendRegions'
import { useKolRadarFeed } from '../../hooks/useKolRadarFeed'
import Ranking from './Ranking'
import KolRadar from './KolRadar'
import styles from './Monitor.module.css'

function formatCollectedAt(iso?: string): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function Monitor() {
  const { region, set } = useApp()
  const trendRegions = useTrendRegions()
  const trends = useTrending(region)
  const kolRadar = useKolRadarFeed()
  const [activeTab, setActiveTab] = useState<'trends' | 'kol'>('trends')

  useEffect(() => {
    if (
      !trendRegions.loading &&
      trendRegions.regions.length > 0 &&
      !trendRegions.regions.includes(region)
    ) {
      set({ region: trendRegions.regions[0] })
    }
  }, [region, set, trendRegions.loading, trendRegions.regions])

  return (
    <>
      <Head
        title="热点监测"
        desc="完整呈现 X 热搜榜和 KOL 雷达采集结果；是否进入响应由事件库承接。"
      />
      <Tabs
        activeKey={activeTab}
        className={styles.monitorTabs}
        items={[
          {
            key: 'trends',
            label: 'X 热搜榜',
            children: (
              <Ranking
                data={trends.data}
                loading={trends.loading || trendRegions.loading}
                error={trends.error ?? trendRegions.error}
                regions={trendRegions.regions}
                collectedLabel={formatCollectedAt(trends.data?.collectedAt)}
                isMock={trends.data?.source === 'mock'}
                onReload={trends.reload}
              />
            ),
          },
          {
            key: 'kol',
            label: 'KOL 雷达',
            children: (
              <KolRadar
                data={kolRadar.data}
                loading={kolRadar.loading}
                error={kolRadar.error}
                onReload={kolRadar.reload}
              />
            ),
          },
        ]}
        onChange={(key) => setActiveTab(key as 'trends' | 'kol')}
      />
    </>
  )
}
