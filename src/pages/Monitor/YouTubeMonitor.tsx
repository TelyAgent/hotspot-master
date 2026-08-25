import { Alert, Button, Card, Empty, Skeleton, Space, Statistic, Tag, Typography, message } from 'antd'
import { ReloadOutlined, SyncOutlined, YoutubeOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { analyzeYoutubeVideo, fetchLatestYoutubeRun, fetchYoutubeBoard, runYoutubeCollection } from '../../api/youtube'
import type { YoutubeBoardVideo, YoutubeRun } from '../../api/youtube'
import { Head } from '../../components/ui'
import styles from './Monitor.module.css'

export default function YouTubeMonitor() {
  const [run, setRun] = useState<YoutubeRun | null>(null)
  const [videos, setVideos] = useState<YoutubeBoardVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null)

  const stats = useMemo(
    () => ({
      activeVideos: videos.length,
      analyzedVideos: videos.filter((item) => item.analysis).length,
      missingTranscript: videos.filter((item) => item.transcriptStatus === 'content_unavailable').length,
    }),
    [videos],
  )

  async function load() {
    setLoading(true)
    try {
      const [latestRun, board] = await Promise.all([fetchLatestYoutubeRun(), fetchYoutubeBoard()])
      setRun(latestRun)
      setVideos(board.videos)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取 YouTube 看板失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRun() {
    setRunning(true)
    try {
      const result = await runYoutubeCollection()
      setRun(result)
      if (result.status === 'failed') {
        message.warning(result.errorMessage || 'YouTube 采集失败')
      } else {
        message.success('YouTube 采集已完成')
      }
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '启动 YouTube 采集失败')
    } finally {
      setRunning(false)
    }
  }

  async function handleAnalyzeVideo(videoId: string) {
    setAnalyzingVideoId(videoId)
    try {
      await analyzeYoutubeVideo(videoId)
      message.success('视频拆解已完成')
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '视频拆解失败')
      await load()
    } finally {
      setAnalyzingVideoId(null)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <>
      <Head
        title="YouTube 监测"
        desc="采集美国热门公开视频，基于字幕和公开指标拆解爆款内容机制。"
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>
              刷新
            </Button>
            <Button type="primary" icon={<YoutubeOutlined />} loading={running} onClick={handleRun}>
              立即采集
            </Button>
          </Space>
        }
      />

      <div className={styles.youtubeStats}>
        <Statistic title="看板视频" value={stats.activeVideos} />
        <Statistic title="已拆解" value={stats.analyzedVideos} />
        <Statistic title="字幕不可用" value={stats.missingTranscript} />
        <Statistic title="最近新增" value={run?.newVideoCount ?? 0} />
      </div>

      {run ? (
        <Card className={styles.youtubeRunCard}>
          <Space wrap size="middle">
            <Tag color={run.status === 'success' ? 'success' : run.status === 'failed' ? 'error' : 'processing'}>
              {run.status}
            </Tag>
            <Typography.Text type="secondary">最近运行：{formatDateTime(run.startedAt)}</Typography.Text>
            <Typography.Text type="secondary">官方热门 {run.officialCount}</Typography.Text>
            <Typography.Text type="secondary">关键词 {run.keywordCount}</Typography.Text>
            <Typography.Text type="secondary">历史命中 {run.historicalCount}</Typography.Text>
            {run.errorMessage ? <Typography.Text type="danger">{run.errorMessage}</Typography.Text> : null}
          </Space>
        </Card>
      ) : null}

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : videos.length === 0 ? (
        <Empty description="暂无 YouTube 看板数据" style={{ marginTop: 18 }} />
      ) : (
        <div className={styles.youtubeGrid}>
          {videos.map((video) => (
            <YoutubeVideoCard
              key={video.videoId}
              video={video}
              analyzing={analyzingVideoId === video.videoId}
              onAnalyze={handleAnalyzeVideo}
            />
          ))}
        </div>
      )}
    </>
  )
}

function YoutubeVideoCard({
  video,
  analyzing,
  onAnalyze,
}: {
  video: YoutubeBoardVideo
  analyzing: boolean
  onAnalyze: (videoId: string) => void
}) {
  const canManualAnalyze = !video.analysis && isFailedAnalysis(video)

  return (
    <Card className={styles.youtubeVideoCard}>
      <div className={styles.youtubeVideoTop}>
        {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <div className={styles.youtubeThumbFallback} />}
        <div>
          <Typography.Title level={4}>
            <a href={video.url} target="_blank" rel="noreferrer">
              {video.title}
            </a>
          </Typography.Title>
          <Typography.Text type="secondary">
            {video.channelTitle || '未知频道'} · 持续火热 {video.consecutiveHotDays} 天
          </Typography.Text>
          <div className={styles.youtubeTags}>
            {video.selectionSources.map((source) => (
              <Tag key={`${source.type}-${source.label}-${source.rank}`}>{source.label}</Tag>
            ))}
            {video.discoveryLabels.map((label) => (
              <Tag key={label} color="processing">
                {label}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.youtubeMetrics}>
        <span>播放 {formatNumber(video.videoMetrics?.viewCount)}</span>
        <span>点赞 {formatNumber(video.videoMetrics?.likeCount)}</span>
        <span>评论 {formatNumber(video.videoMetrics?.commentCount)}</span>
      </div>

      {video.analysis ? (
        <div className={styles.youtubeAnalysis}>
          <AnalysisBlock title="主要原因" items={[video.analysis.mainReason.topic, video.analysis.mainReason.why_attractive, video.analysis.mainReason.traffic_judgment]} />
          <AnalysisBlock title="具体表现" items={[video.analysis.execution.key_technique, video.analysis.execution.effect]} />
          <AnalysisBlock title="复刻建议" items={[video.analysis.replication.reusable_mechanism, video.analysis.replication.product_remix_topic, video.analysis.replication.product_entry]} />
        </div>
      ) : (
        <Alert
          message={getAnalysisMessage(video)}
          action={
            canManualAnalyze ? (
              <Button size="small" type="primary" icon={<SyncOutlined />} loading={analyzing} onClick={() => onAnalyze(video.videoId)}>
                手动拆解
              </Button>
            ) : null
          }
          showIcon
        />
      )}
    </Card>
  )
}

function isFailedAnalysis(video: YoutubeBoardVideo) {
  return video.analysisStatus === 'analysis_failed' || video.analysisStatus === 'content_unavailable'
}

function getAnalysisMessage(video: YoutubeBoardVideo) {
  if (video.analysisStatus === 'analysis_failed') return '拆解失败，可手动重试'
  if (video.analysisStatus === 'content_unavailable' || video.transcriptStatus === 'content_unavailable') {
    return '字幕不可用，可稍后手动重试'
  }
  if (video.analysisStatus === 'running') return '正在拆解'
  return '等待字幕拆解'
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <Typography.Text strong>{title}</Typography.Text>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </section>
  )
}

function formatNumber(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
