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
            <select
              className="filter"
              value={region}
              onChange={(e) => set({ region: e.target.value })}
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <button className="btn">当前Top30</button>
            <button className="btn">对比09:00快照</button>
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
          <div className="note warning">加载失败：{error}</div>
        ) : rows.length === 0 ? (
          <div className="note">该地区暂无热搜数据。</div>
        ) : (
          rows.map((x) => (
            <div className={styles.ranking} key={x.rank}>
              <strong>#{x.rank}</strong>
              <span>
                <b>{x.name}</b>
                <br />
                <small className="muted">{region}榜单原始条目</small>
              </span>
              <span className={`pill ${x.change.includes('↑') ? 'orange' : x.rank <= 5 ? 'green' : ''}`}>
                {x.change}
              </span>
              <span>{x.heat}</span>
              <span className={`pill ${x.signal === '已触发' ? 'green' : ''}`}>{x.signal}</span>
              {x.signal === '已触发' ? (
                <button
                  className="btn link"
                  onClick={() => {
                    const event = ensureEventForTrend(x.name, region, x.rank)
                    set({ event: event.id, eventStatus: '全部' })
                    go('events')
                  }}
                >
                  查看聚合 →
                </button>
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
