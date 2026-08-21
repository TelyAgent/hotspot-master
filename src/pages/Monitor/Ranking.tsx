import { Alert, Button, Empty, Select, Tag } from 'antd'
import { useApp } from '../../context/AppContext'
import type { TrendingResponse } from '../../api/types'
import styles from './Monitor.module.css'

type RankingRow = {
  rank: number
  name: string
  change: string
  signal: '已触发' | '持续观察'
  heat: string
}

export default function Ranking({
  data,
  loading,
  error,
  regions,
}: {
  data: TrendingResponse | null
  loading: boolean
  error: string | null
  regions: string[]
}) {
  const { region, set, go, ensureEventForTrend } = useApp()

  const rows: RankingRow[] = (data?.items ?? []).map((item) => ({
    rank: item.rank,
    name: item.name,
    // 服务端暂未返回涨跌与触发状态（需快照对比），先用占位；后续接快照接口补上
    change: '—',
    signal: item.rank <= 5 ? '已触发' : '持续观察',
    heat: item.heat,
  }))

  return (
    <>
      <section className="card">
        <div className="card-head">
          <div className="filters">
            <Select
              style={{ minWidth: 180 }}
              value={region}
              options={regions.map((r) => ({ value: r, label: r }))}
              onChange={(value) => set({ region: value })}
            />
            <Button>当前Top30</Button>
            <Button>对比09:00快照</Button>
          </div>
          <span className="small">
            共{rows.length}条 · 其中{rows.filter((x) => x.signal === '已触发').length}条满足自动触发
          </span>
        </div>
        <div className={`${styles.ranking} ${styles.header}`}>
          <span>排名</span>
          <span>热搜词/话题</span>
          <span>变化</span>
          <span>热度量级</span>
          <span>聚合状态</span>
          <span>操作</span>
        </div>
        {loading ? (
          <div className="note">正在加载热搜排行榜…</div>
        ) : error ? (
          <Alert type="error" message={`加载失败：${error}`} showIcon />
        ) : rows.length === 0 ? (
          <Empty description="该地区暂无热搜数据" />
        ) : (
          rows.map((x) => (
            <div className={styles.ranking} key={x.rank}>
              <strong>#{x.rank}</strong>
              <span>
                <b>{x.name}</b>
                <br />
                <small className="muted">{region}榜单原始条目</small>
              </span>
              <Tag color={x.change.includes('↑') ? 'warning' : x.rank <= 5 ? 'success' : 'default'}>{x.change}</Tag>
              <span>{x.heat}</span>
              <Tag color={x.signal === '已触发' ? 'success' : 'default'}>{x.signal}</Tag>
              {x.signal === '已触发' ? (
                <Button
                  type="link"
                  onClick={() => {
                    const event = ensureEventForTrend(x.name, region, x.rank)
                    set({ event: event.id, eventStatus: '全部' })
                    go('events')
                  }}
                >
                  查看聚合
                </Button>
              ) : (
                <span className="small">尚未触发响应</span>
              )}
            </div>
          ))
        )}
      </section>
      <div className="note">
        排行榜只承担热点呈现与聚合。已满足触发条件的条目可直接进入对应的事件管理Event；持续观察的条目不会提前创建响应Event。
      </div>
    </>
  )
}
