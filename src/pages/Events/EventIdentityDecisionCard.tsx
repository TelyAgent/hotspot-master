import type { EventMergeDetail } from '../../data/types'
import styles from './EventIdentityDecisionCard.module.css'

export default function EventIdentityDecisionCard({
  decision,
}: {
  decision?: EventMergeDetail['latestIdentityDecision']
}) {
  if (!decision) {
    return (
      <section className={styles.card}>
        <div className={styles.empty}>
          <h2>Event Identity Decision</h2>
          <p>暂无跨来源合并判断。后续来源触发或人工合并后，这里会展示主体、动作、对象、时间和核心事实的比较结果。</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Event Identity Decision</h2>
          <p>标题、关键词、语言、榜单地区、热度和同一人物不能单独作为合并依据。</p>
        </div>
        <div className={styles.confidence}>
          <span>合并置信度</span>
          <strong>{decision.mergeConfidence.toFixed(2)}</strong>
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>判断维度</span>
          <span>比较结果</span>
          <span>结论</span>
        </div>
        {decision.dimensionResults.map((item) => (
          <div className={styles.tableRow} key={item.dimension}>
            <span>{item.label}</span>
            <span>{item.comparison}</span>
            <b className={styles[resultTone(item.result)]}>{resultName(item.result)}</b>
          </div>
        ))}
      </div>

      <div className={styles.systemAction}>
        <b>系统处理：{decision.systemAction}</b>
        <span>{decision.reason}</span>
      </div>
    </section>
  )
}

function resultName(result: string) {
  const names: Record<string, string> = {
    compatible: '兼容',
    conflict: '冲突',
    uncertain: '不确定',
  }
  return names[result] ?? result
}

function resultTone(result: string) {
  if (result === 'conflict') return 'conflict'
  if (result === 'uncertain') return 'uncertain'
  return 'compatible'
}
