import { useApp } from '../../context/AppContext'
import styles from './Monitor.module.css'

export default function HotContent() {
  const { openModal } = useApp()

  return (
    <>
      <div className="note">
        <b>热点内容分析入口</b>
        <br />
        这里承载后续的热点叙事、热门帖子结构、传播账号、观点分歧和内容机会分析，不与事件响应流程混在一起。
      </div>
      <div className={styles.contentModule}>
        {(
          [
            ['叙事与口径', '识别同一热点正在传播的主要叙事、不同说法和变化。'],
            ['热门内容拆解', '分析高互动帖子的标题、结构、表达形式和视觉素材。'],
            ['传播网络', '分析主要传播账号、地区扩散与讨论群体。'],
          ] as [string, string][]
        ).map((x) => (
          <article className={styles.contentCard} key={x[0]}>
            <h2>{x[0]}</h2>
            <p>{x[1]}</p>
            <span className="pill orange">后续模块</span>
            <br />
            <button
              className="btn link"
              onClick={() =>
                openModal(
                  '热点内容分析模块',
                  <p>后续将在此定义分析口径、输入数据和输出物。本轮先保留明确入口和模块边界。</p>,
                  true,
                )
              }
            >
              查看模块规划 →
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
