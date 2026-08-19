import type { TrendItem } from './types'

const trendNames = [
  'OpenAI GPT-6',
  'US CPI',
  'Bitcoin',
  'World Cup',
  'Taylor Swift',
  'NVIDIA',
  'Stablecoin Act',
  'Champions League',
  'Apple Event',
  'Federal Reserve',
  'Ethereum',
  'NBA',
  'K-pop',
  'Japan election',
  'UK inflation',
  'SpaceX',
  'Netflix',
  'Oil prices',
  'Gold',
  'Tesla',
  'AI agents',
  'Climate summit',
  'Premier League',
  'Crypto ETF',
  'Olympics',
  'ChatGPT',
  'Gaming release',
  'US jobs report',
  'Formula 1',
  'Global markets',
]

export const regions = [
  'Worldwide',
  'United States',
  'United Kingdom',
  'Japan',
  'Korea',
]

export const TREND: Record<string, TrendItem[]> = {}

regions.forEach((r, ri) => {
  TREND[r] = trendNames.map((n, i) => ({
    rank: i + 1,
    name: ri ? `${n}${ri === 3 ? ' 日本' : ri === 4 ? ' 한국' : ''}` : n,
    change:
      i < 5
        ? '新上榜'
        : i % 6 === 0
          ? '↑ ' + (10 + (i % 9))
          : i % 4 === 0
            ? '↑ ' + (2 + (i % 7))
            : '—',
    signal: i < 5 || i % 6 === 0 ? '已触发' : '持续观察',
    heat: 98 - i * 2 + 'K',
  }))
})

// 主题内上升话题，用于「重点主题追踪」的详情视图
export const TOPIC_TRENDS: Record<string, [string, string, string, string, string | null][]> = {
  AI: [
    ['OpenAI GPT-6', 'Worldwide', '98K', '新上榜', 'e1'],
    ['AI agents', 'United States', '61K', '↑ 14', null],
    ['ChatGPT', 'United Kingdom', '47K', '↑ 8', null],
    ['NVIDIA AI chips', 'Japan', '39K', '↑ 11', 'e5'],
  ],
  加密监管: [
    ['Stablecoin Act', 'United States', '72K', '↑ 12', 'e3'],
    ['Crypto ETF', 'Worldwide', '54K', '↑ 10', null],
    ['SEC crypto rules', 'United States', '36K', '新上榜', null],
  ],
  体育大赛: [
    ['World Cup', 'Worldwide', '92K', '新上榜', 'e4'],
    ['Champions League', 'United Kingdom', '68K', '↑ 15', null],
    ['Premier League', 'Worldwide', '43K', '↑ 9', null],
  ],
}

export function normalizedTrendName(name: string): string {
  return name.replace(/ 日本| 한국/g, '')
}
