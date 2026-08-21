import { Alert, Card, Empty, Tag } from 'antd'
import { Head } from '../../components/ui'

export default function YouTubeMonitor() {
  return (
    <>
      <Head
        title="YouTube 监测"
        desc="用于承载 YouTube 热门视频、频道内容和趋势信号，后续接入采集源后展示真实数据。"
      />

      <Alert
        message="YouTube 监测页已创建"
        description="当前先保留独立入口和页面边界；后续可以接入 YouTube Trending、频道监控和视频指标追踪。"
        showIcon
        style={{ marginBottom: 14 }}
      />

      <div className="three grid">
        {[
          ['热门视频', '展示 YouTube 热门视频、地区榜单和热度变化。'],
          ['频道追踪', '跟踪重点频道的新视频、播放增长和互动情况。'],
          ['内容机会', '从标题、缩略图、评论和传播表现里提炼内容机会。'],
        ].map(([title, desc]) => (
          <Card key={title} title={title}>
            <p>{desc}</p>
            <Tag color="warning">待接入</Tag>
          </Card>
        ))}
      </div>

      <Empty description="暂无 YouTube 监测数据" style={{ marginTop: 18 }} />
    </>
  )
}
