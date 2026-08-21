import { Button } from 'antd'
import { useApp } from '../../context/AppContext'
import styles from './Monitor.module.css'

export default function Regions() {
  const { events, set, go } = useApp()

  return (
    <div className="three grid">
      {events.slice(0, 3).map((e) => (
        <article className={styles.topic} key={e.id}>
          <h2>{e.title}</h2>
          <div className={styles.regionFlow}>
            {e.regions.split(' / ').map((r, i) => (
              <span key={i}>
                {i ? <i>→</i> : null}
                <span>{r}</span>
              </span>
            ))}
          </div>
          <p className="small">同一话题在多个地区榜单中的排名、表达和帖子聚合。</p>
          <Button
            type="link"
            onClick={() => {
              set({ event: e.id, eventStatus: '全部' })
              go('events')
            }}
          >
            查看已归并Event
          </Button>
        </article>
      ))}
    </div>
  )
}
