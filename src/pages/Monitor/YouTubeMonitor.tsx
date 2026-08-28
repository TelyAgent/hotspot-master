import { Alert, Button, Card, Drawer, Empty, Skeleton, Tag, Typography, message } from 'antd'
import { PlayCircleOutlined, ReloadOutlined, SyncOutlined, YoutubeOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { analyzeYoutubeVideo, fetchLatestYoutubeRun, fetchYoutubeBoard, runYoutubeCollection } from '../../api/youtube'
import type { YoutubeBoardResponse, YoutubeBoardVideo, YoutubeRun } from '../../api/youtube'
import styles from './Monitor.module.css'

type YoutubeAnalysisView = NonNullable<YoutubeBoardVideo['analysis']>

export default function YouTubeMonitor() {
  const [run, setRun] = useState<YoutubeRun | null>(null)
  const [videos, setVideos] = useState<YoutubeBoardVideo[]>([])
  const [boardStats, setBoardStats] = useState<YoutubeBoardResponse['stats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<YoutubeBoardVideo | null>(null)
  const [activeFilter, setActiveFilter] = useState('全部')

  const stats = useMemo(
    () => ({
      todayNew: boardStats?.todayNew ?? run?.newVideoCount ?? countTodayVideos(videos),
      officialVideos:
        boardStats?.officialVideos ??
        countTodayVideos(videos.filter((item) => item.selectionSources.some(isOfficialYoutubeSource))),
      keywordVideos:
        boardStats?.keywordVideos ??
        countTodayVideos(videos.filter((item) => item.matchedKeywords.length > 0)),
      analyzedVideos: boardStats?.analyzedVideos ?? videos.filter((item) => item.analysis).length,
    }),
    [boardStats, run?.newVideoCount, videos],
  )
  const filteredVideos = useMemo(
    () => videos.filter((video) => videoMatchesFilter(video, activeFilter)),
    [activeFilter, videos],
  )

  async function load() {
    setLoading(true)
    try {
      const [latestRun, board] = await Promise.all([fetchLatestYoutubeRun(), fetchYoutubeBoard()])
      setRun(latestRun)
      setVideos(board.videos)
      setBoardStats(board.stats ?? null)
      setSelectedVideo((current) =>
        current ? board.videos.find((item) => item.videoId === current.videoId) ?? current : current,
      )
      return board
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取 YouTube 看板失败')
      return null
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
      const result = await analyzeYoutubeVideo(videoId)
      const patch = buildVideoPatchFromAnalysis(result)
      setVideos((current) => current.map((video) =>
        video.videoId === videoId ? { ...video, ...patch } : video,
      ))
      setSelectedVideo((current) =>
        current?.videoId === videoId ? { ...current, ...patch } : current,
      )
      setBoardStats((current) =>
        current && result.status === 'success' && result.result
          ? { ...current, analyzedVideos: current.analyzedVideos + 1 }
          : current,
      )
      if (result.status === 'success' && result.result) {
        message.success('视频拆解已完成')
      } else if (result.status === 'transcript_unavailable' || result.status === 'content_unavailable') {
        message.warning('字幕不可用，未生成拆解内容')
      } else {
        message.warning('拆解未生成内容，可稍后重试')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '视频拆解失败')
    } finally {
      setAnalyzingVideoId(null)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <>
      <div className={styles.youtubeHero}>
        <div>
          <div className={styles.youtubeEyebrow}>YOUTUBE BREAKOUT PIPELINE</div>
          <Typography.Title level={1}>Breakout Videos</Typography.Title>
          <Typography.Text>每日从美国官方热门和 4 个固定关键词中发现新视频，入选后可手动生成可迁移的三段式拆解。</Typography.Text>
        </div>
      </div>

      <div className={styles.youtubeRuleStrip}>
        <div>
          <b>YouTube 官方热门 · 最多 5 条</b>
          <span>People & Blogs · News & Politics · Science & Technology</span>
        </div>
        <div>
          <b>近 7 天关键词 · 最多 5 条</b>
          <span>Polymarket · web3 · politics · prediction market</span>
        </div>
        <div>
          <b>每日上限 10 条</b>
          <span>video_id 去重 · 拆解由运营手动触发</span>
        </div>
      </div>

      <div className={styles.youtubeStats}>
        <KpiBox value={formatNumber(stats.todayNew)} label="今日新入选" />
        <KpiBox value={formatNumber(stats.officialVideos)} label="官方热门" />
        <KpiBox value={formatNumber(stats.keywordVideos)} label="关键词入选" />
        <KpiBox value={formatNumber(stats.analyzedVideos)} label="已完成拆解" />
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : videos.length === 0 ? (
        <Empty description="暂无 YouTube 看板数据" style={{ marginTop: 18 }} />
      ) : (
        <>
          <div className={styles.youtubeToolbar}>
            <div className={styles.youtubeFilters}>
              {['全部', 'YouTube 官方热门', '关键词 · Polymarket', '关键词 · web3', '关键词 · politics', '关键词 · prediction market'].map((filter) => (
                <Button key={filter} type={activeFilter === filter ? 'primary' : 'default'} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </Button>
              ))}
            </div>
            <div className={styles.youtubeToolbarRight}>
              <span>两类发现来源 · 美国区</span>
              <Button size="small" icon={<ReloadOutlined />} onClick={load}>
                刷新
              </Button>
              <Button size="small" type="primary" icon={<YoutubeOutlined />} loading={running} onClick={handleRun}>
                运行采集
              </Button>
            </div>
          </div>

          <div className={styles.youtubeGrid}>
            {filteredVideos.map((video, index) => (
              <YoutubeVideoCard
                key={`${video.videoId}-${index}`}
                video={video}
                onOpen={setSelectedVideo}
              />
            ))}
          </div>
          {filteredVideos.length === 0 ? <Empty description="没有匹配的视频" style={{ marginTop: 18 }} /> : null}
        </>
      )}

      <YoutubeAnalysisDrawer
        video={selectedVideo}
        analyzing={selectedVideo ? analyzingVideoId === selectedVideo.videoId : false}
        onClose={() => setSelectedVideo(null)}
        onAnalyze={handleAnalyzeVideo}
      />
    </>
  )
}

function KpiBox({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function YoutubeVideoCard({
  video,
  onOpen,
}: {
  video: YoutubeBoardVideo
  onOpen: (video: YoutubeBoardVideo) => void
}) {
  const sourceLabel = getSourceLabel(video)
  const analysisLabel = getAnalysisLabel(video)

  return (
    <Card className={styles.youtubeVideoCard} hoverable onClick={() => onOpen(video)}>
      <div className={styles.youtubeThumb}>
        {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt={video.title} /> : <div className={styles.youtubeThumbFallback} />}
        <span className={styles.youtubeSourceBadge}>{sourceLabel}</span>
        <button className={styles.youtubePlayButton} type="button" aria-label="播放视频" onClick={(event) => openWithoutCardClick(event, () => window.open(video.url, '_blank', 'noopener,noreferrer'))}>
          <PlayCircleOutlined />
        </button>
        <Typography.Title level={3}>{video.title}</Typography.Title>
      </div>

      <div className={styles.youtubeCardBody}>
        <div className={styles.youtubeContentTitleline}>
          <b>{video.channelTitle || '未知频道'}</b>
          <span>{video.analysis ? 'Insight' : analysisLabel.text}</span>
        </div>
        <Typography.Text type="secondary">
          入选 {video.observedAt ? formatDateTime(video.observedAt) : '时间未知'} · 发布 {video.publishedAt ? formatDate(video.publishedAt) : '未知'} · 持续火热 {video.consecutiveHotDays} 天
        </Typography.Text>
        <div className={styles.youtubeTags}>
          {[...video.selectionSources.map((source) => source.label), ...video.discoveryLabels, ...video.matchedKeywords].slice(0, 4).map((label) => (
            <Tag key={label}>{label}</Tag>
          ))}
        </div>
      </div>

      <div className={styles.youtubeVideoStats}>
        <MetricBox label="当前播放" value={formatNumber(video.videoMetrics?.viewCount)} />
        <MetricBox label="点赞" value={formatNumber(video.videoMetrics?.likeCount)} />
        <MetricBox label="评论" value={formatNumber(video.videoMetrics?.commentCount)} />
      </div>

      <div className={styles.youtubeInsightLine}>
        <div>
          <b>{formatNumber(video.videoMetrics?.viewCount)} 播放</b>
          <span>相较上一观测点 暂无</span>
        </div>
        <Button type="primary" size="small" onClick={(event) => openWithoutCardClick(event, () => onOpen(video))}>
          查看拆解
        </Button>
      </div>
    </Card>
  )
}

function YoutubeAnalysisDrawer({
  video,
  analyzing,
  onClose,
  onAnalyze,
}: {
  video: YoutubeBoardVideo | null
  analyzing: boolean
  onClose: () => void
  onAnalyze: (videoId: string) => void
}) {
  const canManualAnalyze = Boolean(video && !video.analysis)

  return (
    <Drawer
      title={null}
      width={620}
      placement="right"
      open={Boolean(video)}
      onClose={onClose}
      className={styles.youtubeDrawer}
      footer={
        video ? (
          <div className={styles.youtubeDrawerFooter}>
            <Button href={video.url} target="_blank" rel="noreferrer" icon={<YoutubeOutlined />}>
              打开视频
            </Button>
            {canManualAnalyze ? (
              <Button type="primary" icon={<SyncOutlined />} loading={analyzing} onClick={() => onAnalyze(video.videoId)}>
                手动拆解
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      {video ? (
        <div className={styles.youtubeDrawerBody}>
          <div className={styles.youtubeDrawerHead}>
            <div className={styles.youtubeTags}>
              <Tag>{getSourceLabel(video)}</Tag>
              {video.matchedKeywords.map((keyword) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
              <Tag color={getAnalysisLabel(video).color}>{getAnalysisLabel(video).text}</Tag>
            </div>
            <Typography.Title level={2}>{video.title}</Typography.Title>
            <Typography.Text type="secondary">
              {video.channelTitle || '未知频道'} · 入选 {video.observedAt ? formatDateTime(video.observedAt) : '时间未知'} · 发布 {video.publishedAt ? formatDate(video.publishedAt) : '未知'}
            </Typography.Text>
          </div>

          <div className={styles.youtubeDrawerSnapshot}>
            <MetricBox label="当前播放" value={formatNumber(video.videoMetrics?.viewCount)} />
            <MetricBox label="账号突破倍数" value="暂无" />
            <MetricBox label="粉丝穿透率" value="暂无" />
            <MetricBox label="传播速度" value="暂无" />
          </div>

          {video.analysis ? (
            <div className={styles.youtubeAnalysisStack}>
              <AnalysisBlock
                title="1. 主要原因"
                items={[
                  ['选题', video.analysis.mainReason?.topic],
                  ['为什么吸引人', video.analysis.mainReason?.why_attractive],
                  ['核心流量判断', video.analysis.mainReason?.traffic_judgment],
                ]}
              />
              <AnalysisBlock
                title="2. 具体表现"
                items={[
                  ['关键手法', video.analysis.execution?.key_technique],
                  ['作用', video.analysis.execution?.effect],
                ]}
              />
              <AnalysisBlock
                title="3. 复刻建议"
                items={[
                  ['可复刻机制', video.analysis.replication?.reusable_mechanism],
                  ['产品二创选题', video.analysis.replication?.product_remix_topic],
                  ['产品如何进入', video.analysis.replication?.product_entry],
                ]}
              />
              {video.analysis.limitations.length ? (
                <div className={styles.youtubeBoundaryNote}>
                  <b>不可复制边界：</b>
                  {video.analysis.limitations.join('；')}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Alert
                className={styles.youtubeMetricNote}
                message="公开视频暂时只能稳定拿到播放、点赞、评论、标题、频道、发布时间、封面和字幕；账号突破倍数、粉丝穿透率、传播速度需要账号基线或多时点快照后才能计算。"
                showIcon
              />
              <Alert message="尚未生成拆解内容，可点击手动拆解。" showIcon />
            </>
          )}
        </div>
      ) : null}
    </Drawer>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.youtubeStatBox}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function AnalysisBlock({ title, items }: { title: string; items: [string, string | undefined | null][] }) {
  return (
    <section className={styles.youtubeAnalysisBlock}>
      <Typography.Title level={3}>{title}</Typography.Title>
      {items.map(([label, value]) => (
        <div className={styles.youtubeAnalysisRow} key={label}>
          <span>{label}</span>
          <b>{value || '暂无'}</b>
        </div>
      ))}
    </section>
  )
}

function getSourceLabel(video: YoutubeBoardVideo) {
  const officialSource = video.selectionSources.find(isOfficialYoutubeSource)
  if (officialSource) return 'YouTube 官方热门'
  const keyword = video.matchedKeywords[0]
  if (keyword) return `关键词 · ${keyword}`
  return video.selectionSources[0]?.label || 'YouTube'
}

function videoMatchesFilter(video: YoutubeBoardVideo, filter: string) {
  if (filter === '全部') return true
  if (filter === 'YouTube 官方热门') {
    return video.selectionSources.some(isOfficialYoutubeSource)
  }
  if (filter.startsWith('关键词 · ')) {
    const keyword = filter.replace('关键词 · ', '').toLowerCase()
    return video.matchedKeywords.some((item) => item.toLowerCase() === keyword)
  }
  return true
}

function isOfficialYoutubeSource(source: YoutubeBoardVideo['selectionSources'][number]) {
  return source.type === 'youtube_trending' || source.type === 'official_popular' || source.label.includes('官方热门')
}

function countTodayVideos(videos: YoutubeBoardVideo[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return videos.filter((video) => {
    if (!video.observedAt) return false
    const observedAt = new Date(video.observedAt).getTime()
    return Number.isFinite(observedAt) && observedAt >= todayStart
  }).length
}

function buildVideoPatchFromAnalysis(result: Awaited<ReturnType<typeof analyzeYoutubeVideo>>): Partial<YoutubeBoardVideo> {
  return {
    analysisStatus: result.status,
    transcriptStatus: result.transcriptStatus ?? null,
    analysis: normalizeAnalysisResult(result.result),
  }
}

function normalizeAnalysisResult(result: unknown): YoutubeBoardVideo['analysis'] {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null
  const record = result as Record<string, unknown>
  return {
    mainReason: isRecord(record.main_reason) ? record.main_reason as YoutubeAnalysisView['mainReason'] : null,
    execution: isRecord(record.execution) ? record.execution as YoutubeAnalysisView['execution'] : null,
    replication: isRecord(record.replication) ? record.replication as YoutubeAnalysisView['replication'] : null,
    limitations: Array.isArray(record.limitations) ? record.limitations.filter((item): item is string => typeof item === 'string') : [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getAnalysisLabel(video: YoutubeBoardVideo): { text: string; color: 'success' | 'error' | 'processing' | 'default' | 'warning' } {
  if (video.analysis) return { text: '已拆解', color: 'success' }
  if (video.analysisStatus === 'running') return { text: '拆解中', color: 'processing' }
  if (video.analysisStatus === 'analysis_failed') return { text: '拆解失败', color: 'error' }
  if (video.analysisStatus === 'content_unavailable' || video.transcriptStatus === 'content_unavailable') return { text: '字幕不可用', color: 'warning' }
  return { text: '待拆解', color: 'default' }
}

function openWithoutCardClick(event: MouseEvent<HTMLElement>, callback: () => void) {
  event.stopPropagation()
  callback()
}

function formatNumber(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
