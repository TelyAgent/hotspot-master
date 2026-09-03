import { useState } from 'react'
import { Button, Drawer, Input, Tabs, Tag, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './Decision.module.css'

const goals = ['把事情讲清楚', '提供有用判断', '分享观点和分析', '教会一个方法', '引发讨论', '引导采取行动']
const readers = ['AI 开发者', '产品经理 / 创业者', '普通科技用户', '已有社群用户']
const formats = ['X 短帖', 'X Thread', '回复 / 引用帖', '图文事实卡', '短视频脚本', '长文 / Newsletter']

export default function CreationWorkspace() {
  const navigate = useNavigate()
  const [kitchenOpen, setKitchenOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedGoals, setSelectedGoals] = useState(['把事情讲清楚', '提供有用判断'])
  const [selectedReader, setSelectedReader] = useState('AI 开发者')
  const [format, setFormat] = useState('X Thread')
  const [draft, setDraft] = useState(
    'GPT-6 API 已经开放，但“新模型上线”不等于“现在就该迁移”。\n\n先回答三个问题：\n1. 你的任务是否真的需要新增能力？\n2. 成本能否覆盖质量增益？\n3. 现有工具链是否兼容？',
  )

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goal)) return prev.length === 1 ? prev : prev.filter((item) => item !== goal)
      if (prev.length >= 3) {
        message.warning('最多选择 3 个目标')
        return prev
      }
      return [...prev, goal]
    })
  }

  return (
    <div className={styles.decisionPage}>
      <Button className={styles.ghostButton} icon={<ArrowLeftOutlined />} onClick={() => navigate('/decision/creation')}>
        返回 AI 创作中心
      </Button>
      <section className={styles.workspaceHead}>
        <div className={styles.tagrow}>
          <Tag color="blue">Event</Tag>
          <Tag color="green">官方确认</Tag>
          <Tag>Context Pack v4</Tag>
        </div>
        <h1>OpenAI 正式发布 GPT-6 API</h1>
        <p>热点情报系统收集的事件信息与上游判断，已完整带入本次内容制作。</p>
        <div className={styles.reason}>
          <b>最新变化：</b>多个地区上榜 · 1 小时上升 12 位
        </div>
      </section>

      <Tabs
        className={styles.workspaceTabs}
        items={[
          {
            key: 'product',
            label: '产品承接机会',
            children: (
              <section className={styles.workspaceSection}>
                <h2>产品承接机会</h2>
                <p className={styles.muted}>实时市场和产品价值关联是上游已经打包好的内容输入。</p>
                <article className={`${styles.angleItem} ${styles.angleSelected}`}>
                  <h3>PredX 实时市场</h3>
                  <div className={styles.bridge}>
                    <b>GPT-6 API 会在本周引发大规模生产迁移吗？ 41%</b>
                    <p>24h +7pt · 12 分钟前更新</p>
                    <a>在 PredX 打开这个市场 ↗</a>
                  </div>
                </article>
                <article className={styles.angleItem}>
                  <h3>产品价值关联</h3>
                  <p>用条件、概率和新证据更新，帮助用户拆解“是否迁移”的判断。</p>
                </article>
              </section>
            ),
          },
          {
            key: 'info',
            label: '相关信息',
            children: (
              <section className={styles.infoGrid}>
                <div className={styles.panel}>
                  <h3>事件画像</h3>
                  <InfoRow label="所属领域" value="AI / 大模型 / 开发者工具" />
                  <InfoRow label="事件类型" value="官方产品发布" />
                  <InfoRow label="发生时间" value="今天 10:42" />
                  <InfoRow label="当前热度" value="多个地区上榜 · 1 小时上升 12 位" />
                </div>
                <div className={styles.panel}>
                  <h3>来源与素材</h3>
                  <InfoRow label="OpenAI 官方公告" value="打开来源 ↗" />
                  <InfoRow label="API 文档与定价页" value="打开来源 ↗" />
                  <InfoRow label="开发者社区讨论" value="打开来源 ↗" />
                </div>
              </section>
            ),
          },
          {
            key: 'angle',
            label: '内容创作角度',
            children: (
              <section className={styles.workspaceSection}>
                <div className={styles.sectionTitle}>
                  <h2>内容创作角度</h2>
                  <Button>重新推荐</Button>
                </div>
                {['把发布新闻翻译成开发者迁移判断清单', '从定价变化讨论 Agent 产品的成本结构', '只解释模型能力边界，不复述发布新闻'].map((item, index) => (
                  <article className={`${styles.angleItem} ${index === 0 ? styles.angleSelected : ''}`} key={item}>
                    <h3>0{index + 1} · {item}</h3>
                    <p className={styles.muted}>候选表达方向 · 点击选择</p>
                  </article>
                ))}
                <div className={styles.editActions}>
                  <Button>暂不采用</Button>
                  <Button>修改后采用</Button>
                  <Button type="primary" onClick={() => setKitchenOpen(true)}>直接采用并制作</Button>
                </div>
              </section>
            ),
          },
          {
            key: 'kitchen',
            label: '内容厨房',
            children: (
              <section className={styles.workspaceSection}>
                <div className={styles.sectionTitle}>
                  <h2>内容厨房</h2>
                  <Button type="primary" onClick={() => setKitchenOpen(true)}>打开内容厨房</Button>
                </div>
                <div className={styles.panel}>
                  <h3>本次默认制作输入</h3>
                  <InfoRow label="已继承 Angle" value="开发者迁移判断清单" />
                  <InfoRow label="事实边界" value="免费额度待确认，不写成事实；避免替 OpenAI 承诺迁移收益。" />
                  <InfoRow label="推荐制作路径" value="提供有用判断 · AI 开发者 · 快讯账号 · X Thread" />
                </div>
              </section>
            ),
          },
        ]}
      />

      <Drawer
        title="内容厨房"
        open={kitchenOpen}
        width="100%"
        className={styles.kitchenDrawer}
        onClose={() => setKitchenOpen(false)}
        footer={
          <div className={styles.drawerFooter}>
            <Button onClick={() => setKitchenOpen(false)}>保存并退出</Button>
            <div>
              {step > 1 ? <Button onClick={() => setStep((prev) => prev - 1)}>上一步</Button> : null}
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={() => {
                  if (step < 4) setStep((prev) => prev + 1)
                  else {
                    setKitchenOpen(false)
                    navigate('/decision/publish')
                  }
                }}
              >
                {step === 4 ? '标记采用' : '下一步'}
              </Button>
            </div>
          </div>
        }
      >
        <div className={styles.kitchenLayout}>
          <div>
            <div className={styles.kitchenSteps}>
              {['这条内容要做什么', '给谁看、怎么说', '做成什么内容', '生成并修改'].map((item, index) => (
                <button className={step === index + 1 ? styles.kitchenStepActive : ''} key={item} type="button" onClick={() => setStep(index + 1)}>
                  {index + 1} {item}
                </button>
              ))}
            </div>
            {step === 1 ? (
              <ChoiceGrid title="发这条内容，你最想实现什么？" items={goals} selected={selectedGoals} onClick={toggleGoal} />
            ) : step === 2 ? (
              <ChoiceGrid title="这条内容说给谁听？" items={readers} selected={[selectedReader]} onClick={setSelectedReader} />
            ) : step === 3 ? (
              <ChoiceGrid title="想做成什么内容？" items={formats} selected={[format]} onClick={setFormat} />
            ) : (
              <section className={styles.workspaceSection}>
                <h2>生成并修改内容</h2>
                <Input.TextArea value={draft} autoSize={{ minRows: 10, maxRows: 18 }} onChange={(event) => setDraft(event.target.value)} />
                <div className={styles.aiBox}>
                  <h3>AI 修改内容</h3>
                  <div className={styles.filters}>
                    {['开头更直接', '压缩篇幅', '加强判断', '调整语气', '检查事实边界'].map((item) => (
                      <button className={styles.chip} key={item} type="button">{item}</button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
          <aside className={styles.summaryPanel}>
            <h3>本次制作</h3>
            <InfoRow label="已继承角度" value="开发者迁移判断清单" />
            <InfoRow label="主要目标" value={selectedGoals[0]} />
            <InfoRow label="目标读者" value={selectedReader} />
            <InfoRow label="表达人设" value="快讯账号" />
            <InfoRow label="主要成品" value={format} />
          </aside>
        </div>
      </Drawer>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <b>{label}</b>
      <span>{value}</span>
    </div>
  )
}

function ChoiceGrid({
  title,
  items,
  selected,
  onClick,
}: {
  title: string
  items: string[]
  selected: string[]
  onClick: (item: string) => void
}) {
  return (
    <section className={styles.workspaceSection}>
      <h2>{title}</h2>
      <div className={styles.choiceGrid}>
        {items.map((item) => (
          <button className={`${styles.selectCard} ${selected.includes(item) ? styles.selectCardActive : ''}`} key={item} type="button" onClick={() => onClick(item)}>
            {selected.includes(item) ? <CheckOutlined /> : null}
            <h3>{item}</h3>
            <p>生成后可继续编辑或派生</p>
          </button>
        ))}
      </div>
    </section>
  )
}
