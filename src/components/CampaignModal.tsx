import { Alert, Button, Card } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useApp } from '../context/AppContext'
import styles from './CampaignModal.module.css'

const PLANS: [string, string, string, string, string][] = [
  [
    '实时数据竞猜预热',
    '围绕事件结果设计轻量预测互动',
    '拉动用户关注与市场访问',
    '内容账号 + 产品页',
    '需要确认对应市场已上线',
  ],
  [
    '发布日前瞻内容周',
    '连续发布背景、情景和结果解读',
    '建立专业心智与持续触达',
    '解释型账号 + KOL推荐',
    '需要准备3套情景素材',
  ],
  [
    '结果公布即时挑战',
    '结果出来后快速发起观点挑战',
    '提高互动和新增用户',
    '快讯号 + 社群 + KOL',
    '缺少自动结算能力，需人工承接',
  ],
]

export default function CampaignModal() {
  const { campaignVersion, campaignChoice, set } = useApp()

  return (
    <div>
      <div className="card-head">
        <div>
          <h2>三个差异化候选 · v{campaignVersion}</h2>
          <p className="small">不要求所有专项条件同时满足；可以重新生成全部候选。</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            set({ campaignVersion: campaignVersion + 1, campaignChoice: null })
          }
        >
          重新生成3个
        </Button>
      </div>

      <div className={styles.campaignGrid}>
        {PLANS.map((p, i) => (
          <Card
            key={i}
            className={`${styles.campaign} ${campaignChoice === i ? styles.selected : ''}`}
            title={`方案${i + 1} · ${p[0]}`}
          >
            <p>{p[1]}</p>
            <small>
              <b>目标：</b>
              {p[2]}
              <br />
              <b>渠道：</b>
              {p[3]}
              <br />
              <b>准备缺口：</b>
              {p[4]}
            </small>
            <Button
              type={campaignChoice === i ? 'primary' : 'default'}
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => set({ campaignChoice: i })}
            >
              {campaignChoice === i ? '已选择' : '选择方案'}
            </Button>
          </Card>
        ))}
      </div>

      <Alert
        style={{ marginTop: 12 }}
        message="选定后的最终交付"
        description="活动名称、机制、适配原因、目标、受众、渠道、时间、准备度、缺口和KOL推荐；系统到方案交付为止，不自动执行。"
        showIcon
      />
    </div>
  )
}
