import { useApp } from '../../context/AppContext'
import { TREND } from '../../data/trends'
import { Head, Chart } from '../../components/ui'
import styles from './Overview.module.css'

const manual: [string, string, string][] = [
  ['red', '稳定币法案', '候选生成重试3次后失败'],
  ['', 'GPT-6快讯', '候选待运营选择'],
  ['', '美国CPI', '已发布，等待URL回填'],
]

const anomalies: [string, string, string][] = [
  ['内容生成异常', '1', '已升级运营负责人'],
  ['数据追踪异常', '3', '发布完成，不影响完成状态'],
  ['URL校验失败', '2', '未写入发布记录'],
]

const taskGroups: [string, string, string, string][] = [
  ['稳定币法案通过参议院', '3个账号任务', '67%', '2/3完成'],
  ['GPT-6发布预告', '4个账号任务', '50%', '2/4完成'],
  ['美国CPI公布', '3个账号任务', '33%', '1/3完成'],
]

const accounts: [string, string, number][] = [
  ['WatcherGuru快讯号', '82%', 86],
  ['PredX Explain', '76%', 73],
  ['PredX Markets', '71%', 62],
  ['Domer', '64%', 48],
]

export default function Overview() {
  const { go } = useApp()

  return (
    <>
      <Head
        title="运营总览"
        desc="先看运营结果，再处理待办、异常、任务进度与当前热点。"
        actions={
          <>
            <button className="btn">过去7天⌄</button>
            <button className="btn primary" onClick={() => go('tasks')}>
              进入内容发布
            </button>
          </>
        }
      />

      <section className={styles.stats}>
        <div className={styles.stat}>
          <label>48小时表现良好率</label>
          <strong>71%</strong>
          <span className="small">27/38 条达到1,000+浏览</span>
        </div>
        {(
          [
            ['总浏览量', '1.82M', '↑18.6%'],
            ['互动总量', '42.6K', '↑9.4%'],
            ['已发布内容', '38', '9个账号'],
            ['平均首发用时', '12m', '↓3分钟'],
          ] as [string, string, string][]
        ).map((x, i) => (
          <div className={styles.stat} key={i}>
            <label>{x[0]}</label>
            <strong>{x[1]}</strong>
            <span className={styles.delta}>{x[2]}</span>
          </div>
        ))}
      </section>

      <div className={`two grid ${styles.overviewBlock}`}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>结果趋势</h2>
              <p className="small">浏览与互动的7日变化</p>
            </div>
            <span className="pill green">持续上升</span>
          </div>
          <Chart />
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>账号表现</h2>
              <p className="small">用于判断账号负载与内容效果</p>
            </div>
            <button className="btn link" onClick={() => go('insights')}>
              查看复盘 →
            </button>
          </div>
          {accounts.map((x, i) => (
            <div className={styles.accountPerformance} key={i}>
              <b>{x[0]}</b>
              <span className={styles.miniBar}>
                <i style={{ width: `${x[2]}%` }}></i>
              </span>
              <strong>{x[1]}</strong>
            </div>
          ))}
        </section>
      </div>

      <div className={`two grid ${styles.overviewBlock}`}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>需要人工处理</h2>
              <p className="small">只呈现自动链路无法自行完成的工作</p>
            </div>
            <span className="pill orange">3项</span>
          </div>
          {manual.map((x, i) => (
            <div className={styles.attention} key={i}>
              <i className={`${styles.severity} ${x[0] === 'red' ? styles.red : ''}`}></i>
              <span>
                <b>{x[1]}</b>
                <br />
                <small className="muted">{x[2]}</small>
              </span>
              <button className="btn mini" onClick={() => go('tasks')}>
                处理
              </button>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>链路异常</h2>
              <p className="small">定位采集、生成、发布与追踪中的问题</p>
            </div>
            <span className={styles.anomalyCount}>6</span>
          </div>
          {anomalies.map((x, i) => (
            <div className={styles.attention} key={i}>
              <i className={`${styles.severity} ${x[0].includes('生成') ? styles.red : ''}`}></i>
              <span>
                <b>
                  {x[0]} · {x[1]}项
                </b>
                <br />
                <small className="muted">{x[2]}</small>
              </span>
              <button className="btn mini" onClick={() => go('tasks')}>
                查看
              </button>
            </div>
          ))}
        </section>
      </div>

      <div className="section">
        <div>
          <h2>进行中的任务组</h2>
          <p className="small">按Event查看账号任务的整体推进情况</p>
        </div>
        <button className="btn link" onClick={() => go('tasks')}>
          查看全部发布任务 →
        </button>
      </div>
      <section className="card">
        <div className={styles.taskProgress}>
          <span>关联Event</span>
          <span>账号任务</span>
          <span>进度</span>
          <span>状态</span>
        </div>
        {taskGroups.map((x, i) => (
          <div className={styles.taskProgress} key={i}>
            <b>{x[0]}</b>
            <span>{x[1]}</span>
            <span className={styles.progressTrack}>
              <i style={{ width: x[2] }}></i>
            </span>
            <span className={`pill ${x[2] === '67%' ? 'green' : 'orange'}`}>{x[3]}</span>
          </div>
        ))}
      </section>

      <div className="section">
        <div>
          <h2>当前榜单重点</h2>
          <p className="small">快速了解当前热度；完整Top30与聚合信息在热点监测</p>
        </div>
        <button className="btn link" onClick={() => go('monitor')}>
          查看Top30 →
        </button>
      </div>
      <div className="three grid">
        {TREND.Worldwide.slice(0, 3).map((x) => (
          <div className={styles.topic} key={x.rank}>
            <span className={styles.number}>#{x.rank}</span>
            <h3>{x.name}</h3>
            <span className="small">
              {x.change} · {x.heat}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
