import { useEffect, useState } from 'react'
import { Alert, Button, Empty, List, Tabs, Tag } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useTrending } from '../../hooks/useTrending'
import { useTrendRegions } from '../../hooks/useTrendRegions'
import { useKolRadarFeed } from '../../hooks/useKolRadarFeed'
import { useEvents } from '../../hooks/useEvents'
import type { EventItem } from '../../data/types'
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

type MonitorTabKey = 'trends' | 'kol' | 'topics' | 'tweets'

type HotTweet = {
  rank: number
  author: string
  handle: string
  text: string
  views: number
  likes: number
  replies: number
  reposts: number
  postedAt: string
  url: string
  type: '原创' | '二创'
}

const MOCK_HOT_TWEETS: HotTweet[] = [
  {
    rank: 1,
    author: '李新宝',
    handle: '@lixinbao_X',
    text: 'iPhone Duo 从这个角度看折痕还是很明显的，强如苹果也没有办法彻底消除折痕。',
    views: 2265000,
    likes: 2300,
    replies: 551,
    reposts: 175,
    postedAt: '14 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 2,
    author: '小互',
    handle: '@xiaohu',
    text: '苹果为你准备了能说服你购买 iPhone Duo 的理由。',
    views: 1113000,
    likes: 10000,
    replies: 221,
    reposts: 1500,
    postedAt: '9 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 3,
    author: '动物园园长',
    handle: '@weiyux2021',
    text: '一个关于认知边界和财富机会的观察，引发了大量讨论。',
    views: 940000,
    likes: 434,
    replies: 333,
    reposts: 7,
    postedAt: '8 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 4,
    author: '沐阳',
    handle: '@yyyole',
    text: '折叠屏外屏的布局和展开动画，可能比参数更直接影响实际使用体验。',
    views: 963000,
    likes: 3300,
    replies: 382,
    reposts: 212,
    postedAt: '9 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 5,
    author: '迷人的小红',
    handle: '@miren_41319',
    text: '某平台刚上线的争议性礼物很快下线，再次引发了关于内容审核的讨论。',
    views: 543000,
    likes: 322,
    replies: 285,
    reposts: 3,
    postedAt: '9 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 6,
    author: 'AB Kuai.Dong',
    handle: '@_FORAB',
    text: '一家企业向员工赠送新款手机并承担税费，相关成本和员工福利安排引发关注。',
    views: 285000,
    likes: 633,
    replies: 182,
    reposts: 14,
    postedAt: '6 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 7,
    author: '铁手',
    handle: '@0427SMtieshou',
    text: '新款折叠屏产品引发热议，围绕企业福利、消费和品牌营销的讨论持续升温。',
    views: 410000,
    likes: 1100,
    replies: 481,
    reposts: 8,
    postedAt: '8 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 8,
    author: '李新宝',
    handle: '@lixinbao_X',
    text: '公司内部围绕生育和医学常识的对话引发讨论，评论区出现明显分歧。',
    views: 1107000,
    likes: 2600,
    replies: 511,
    reposts: 51,
    postedAt: '22 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 9,
    author: 'hsn',
    handle: '@hsn8086',
    text: '围绕一个热门事件的即时反应获得大量曝光，讨论仍在快速扩散。',
    views: 895000,
    likes: 797,
    replies: 192,
    reposts: 44,
    postedAt: '23 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 10,
    author: '三木真黒',
    handle: '@highighig',
    text: '一条关于社会话题的提问引发高互动，评论区形成了多轮延伸讨论。',
    views: 730000,
    likes: 4100,
    replies: 404,
    reposts: 175,
    postedAt: '23 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 11,
    author: 'AYi',
    handle: '@AYi_AInotes',
    text: '从产品交互细节切入分析新设备体验，长文本带来持续的转发和讨论。',
    views: 192000,
    likes: 397,
    replies: 85,
    reposts: 47,
    postedAt: '7 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 12,
    author: 'Aron厚玉',
    handle: '@aronhouyu',
    text: '发现手机系统中一个可以改善使用体验的功能，短时间内获得大量互动。',
    views: 492000,
    likes: 5200,
    replies: 323,
    reposts: 452,
    postedAt: '17 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 13,
    author: '作家崔成浩',
    handle: '@cuichenghao',
    text: '一则公共人物相关消息在社交媒体扩散，引发对职业安排和公共回应的关注。',
    views: 193000,
    likes: 696,
    replies: 121,
    reposts: 81,
    postedAt: '7 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 14,
    author: '徐跑跑',
    handle: '@xupaopaogm',
    text: '一个关于消费选择的问题引发讨论，图片内容进一步提高了帖子的传播效率。',
    views: 575000,
    likes: 227,
    replies: 500,
    reposts: 0,
    postedAt: '23 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 15,
    author: '外汇交易员',
    handle: '@fxtrader',
    text: '关于美国中期选举和潜在经济政策的观点获得市场参与者关注。',
    views: 144000,
    likes: 404,
    replies: 159,
    reposts: 34,
    postedAt: '7 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 16,
    author: '徐跑跑',
    handle: '@xupaopaogm',
    text: '围绕升学和个人经历的轻量化表达获得大量曝光，互动集中在评论区。',
    views: 444000,
    likes: 350,
    replies: 461,
    reposts: 5,
    postedAt: '19 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 17,
    author: 'AB Kuai.Dong',
    handle: '@_FORAB',
    text: '一则与加密货币相关的突发市场消息在短时间内完成快速传播。',
    views: 460000,
    likes: 464,
    replies: 224,
    reposts: 29,
    postedAt: '20 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 18,
    author: 'AB Kuai.Dong',
    handle: '@_FORAB',
    text: '加密资产在发行后出现剧烈波动，相关观点引发投资者关注。',
    views: 461000,
    likes: 93,
    replies: 75,
    reposts: 5,
    postedAt: '21 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 19,
    author: '李新宝',
    handle: '@lixinbao_X',
    text: '新设备真机体验继续登上榜单，用户重点讨论机身厚度、重量和交互变化。',
    views: 258000,
    likes: 842,
    replies: 138,
    reposts: 82,
    postedAt: '13 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 20,
    author: '曾颖',
    handle: '@zengying1107',
    text: '一条带有明显个人观点的社会话题内容获得高互动，讨论情绪较为集中。',
    views: 112000,
    likes: 1000,
    replies: 372,
    reposts: 20,
    postedAt: '5 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 21,
    author: '李新宝',
    handle: '@lixinbao_X',
    text: '关于新款折叠设备的真机细节观察，继续在科技用户群体中扩散。',
    views: 271000,
    likes: 94,
    replies: 40,
    reposts: 6,
    postedAt: '14 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 22,
    author: '小宇妈妈',
    handle: '@xiaoyumama9968',
    text: '关于个人信息和数据安全的经历分享，引发对信息收集边界的讨论。',
    views: 360000,
    likes: 1300,
    replies: 721,
    reposts: 16,
    postedAt: '18 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 23,
    author: 'ty≃f{X}^AI²·Paradigm',
    handle: '@TaNGSoFT',
    text: '一条关于公众人物早期经历的内容获得持续曝光，图片和评论共同推动传播。',
    views: 372000,
    likes: 49,
    replies: 57,
    reposts: 3,
    postedAt: '21 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 24,
    author: '川沐｜Trumoo',
    handle: '@xiaomustock',
    text: 'AI 模型和价格策略变化引发行业讨论，用户关注性能、成本和竞争格局。',
    views: 31000,
    likes: 114,
    replies: 16,
    reposts: 6,
    postedAt: '1 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 25,
    author: '魔都老猿',
    handle: '@AriXZone',
    text: '围绕制造业用工和劳务派遣比例的调查式内容引发广泛关注。',
    views: 111000,
    likes: 881,
    replies: 139,
    reposts: 74,
    postedAt: '7 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 26,
    author: '孙宇晨',
    handle: '@sunyuchentron',
    text: '一条简短观点获得较高曝光，围绕产品和市场的讨论持续发酵。',
    views: 382000,
    likes: 1900,
    replies: 552,
    reposts: 35,
    postedAt: '22 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 27,
    author: 'AB Kuai.Dong',
    handle: '@_FORAB',
    text: '裁员和办公资产流入二手市场的观察，连接了企业经营和消费市场两个话题。',
    views: 272000,
    likes: 343,
    replies: 140,
    reposts: 33,
    postedAt: '18 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 28,
    author: '哈哈哥',
    handle: '@crypto_daha',
    text: '一则轻量化图片内容获得快速传播，互动主要来自转发和评论。',
    views: 85000,
    likes: 276,
    replies: 73,
    reposts: 2,
    postedAt: '5 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 29,
    author: '孔义兴',
    handle: '@KyxBtc',
    text: '关于国行设备和 eSIM 的观点引发用户对产品策略和市场价格的讨论。',
    views: 125000,
    likes: 165,
    replies: 66,
    reposts: 0,
    postedAt: '8 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
  {
    rank: 30,
    author: '哈哈哥',
    handle: '@crypto_daha',
    text: '一条情绪化表达获得较高曝光，评论区围绕事件背景展开进一步讨论。',
    views: 291000,
    likes: 829,
    replies: 449,
    reposts: 13,
    postedAt: '19 小时前',
    url: 'https://sopilot.net/zh/rank/tweets?range=24h',
    type: '二创',
  },
]

export default function Monitor() {
  const { region, set } = useApp()
  const trendRegions = useTrendRegions()
  const trends = useTrending(region)
  const kolRadar = useKolRadarFeed()
  const hotTopics = useEvents({ page: 1, pageSize: 20 })
  const [activeTab, setActiveTab] = useState<MonitorTabKey>('trends')

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
                collecting={kolRadar.collecting}
                error={kolRadar.error}
                onCollect={kolRadar.collectNow}
              />
            ),
          },
          {
            key: 'topics',
            label: '热门话题',
            children: (
              <HotTopics
                events={hotTopics.events}
                loading={hotTopics.loading}
                error={hotTopics.error}
                total={hotTopics.total}
                onReload={hotTopics.reload}
              />
            ),
          },
          {
            key: 'tweets',
            label: '热门推文',
            children: <HotTweets />,
          },
        ]}
        onChange={(key) => setActiveTab(key as MonitorTabKey)}
      />
    </>
  )
}

function HotTopics({
  events,
  loading,
  error,
  total,
  onReload,
}: {
  events: EventItem[]
  loading: boolean
  error: string | null
  total: number
  onReload: () => void
}) {
  return (
    <section className={styles.hotTopics}>
      <div className={styles.monitorSectionHead}>
        <div>
          <h2>热门话题</h2>
          <p>复用事件管理中的 Event 数据，展示当前已进入事件层的热门话题。</p>
        </div>
        <Button onClick={onReload}>刷新列表</Button>
      </div>
      {loading ? <div className="note">正在加载热门话题…</div> : null}
      {error ? <Alert type="error" showIcon message={`加载失败：${error}`} /> : null}
      {!loading && !error && events.length === 0 ? <Empty description="暂无热门话题" /> : null}
      {!loading && !error && events.length > 0 ? (
        <>
          <List
            className={styles.hotTopicList}
            dataSource={events}
            renderItem={(event, index) => (
              <List.Item key={event.id}>
                <div className={styles.hotTopicItem}>
                  <div className={styles.hotTopicRank}>#{index + 1}</div>
                  <div className={styles.hotTopicBody}>
                    <div className={styles.hotTopicTitleRow}>
                      <h3>{event.title}</h3>
                      <Tag color={event.verify === '存在冲突' ? 'warning' : 'processing'}>
                        {event.status}
                      </Tag>
                    </div>
                    <p>{event.summary}</p>
                    <div className={styles.hotTopicMeta}>
                      <span>{event.trigger}</span>
                      <span>{event.evidence?.length ?? 0} 条证据</span>
                      <span>{event.updatedAt ? formatCollectedAt(event.updatedAt) : '--'} 更新</span>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          <div className="note">共 {total} 条事件，当前展示前 {events.length} 条</div>
        </>
      ) : null}
    </section>
  )
}

function HotTweets() {
  return (
    <section className={styles.hotTweets}>
      <div className={styles.monitorSectionHead}>
        <div>
          <h2>热门推文</h2>
          <p>按近 24 小时平均曝光和互动表现整理的热门推文示例。</p>
        </div>
        <Tag color="blue">24 小时榜单</Tag>
      </div>
      <List
        className={styles.hotTweetList}
        dataSource={MOCK_HOT_TWEETS}
        renderItem={(tweet) => (
          <List.Item key={`${tweet.rank}-${tweet.handle}`}>
            <div className={styles.hotTweetItem}>
              <div className={styles.hotTweetRank}>#{tweet.rank}</div>
              <div className={styles.hotTweetBody}>
                <div className={styles.hotTweetTitleRow}>
                  <div>
                    <strong>{tweet.author}</strong>
                    <span className={styles.hotTweetHandle}>{tweet.handle}</span>
                  </div>
                  <Tag>{tweet.type}</Tag>
                </div>
                <p>{tweet.text}</p>
                <div className={styles.hotTweetMeta}>
                  <span>{tweet.postedAt}</span>
                  <span>曝光 {formatNumber(tweet.views)}</span>
                  <span>点赞 {formatNumber(tweet.likes)}</span>
                  <span>评论 {formatNumber(tweet.replies)}</span>
                  <span>转发 {formatNumber(tweet.reposts)}</span>
                </div>
              </div>
              <Button
                type="link"
                icon={<LinkOutlined />}
                href={tweet.url}
                target="_blank"
                rel="noreferrer"
              >
                查看榜单
              </Button>
            </div>
          </List.Item>
        )}
      />
      <div className="note">
        数据结构参考{' '}
        <a href="https://sopilot.net/zh/rank/tweets?range=24h" target="_blank" rel="noreferrer">
          SoPilot 推文起爆榜
        </a>
        ，当前为前端 mock 数据。
      </div>
    </section>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
