export type RecommendationBasis = 'heat' | 'market' | 'product'
export type DecisionPriority = 'immediate' | 'today'

export interface DecisionRecommendation {
  id: string
  title: string
  summary: string
  labels: string[]
  basis: RecommendationBasis
  basisLabel: string
  priority: DecisionPriority
  age: string
  reason: string
  productBridge: string
  evidence: string[]
  angles: string[]
  risk: string
}

export interface ContextInboxItem {
  id: string
  title: string
  source: string
  quality: string
  status: 'pending' | 'working' | 'missing' | 'done'
  statusText: string
  conclusion: string
  receivedAt: string
  summary: string
}

export interface DecisionRecord {
  id: string
  title: string
  basis: string
  result: 'adopted' | 'edited' | 'rejected'
  resultText: string
  angle: string
  note: string
  regen: number
  operator: string
  time: string
  timeline: string[]
}

export const recommendations: DecisionRecommendation[] = [
  {
    id: 'rec-fed-cut',
    title: '美联储 9 月降息概率升至 72%',
    summary: '预测市场与宏观讨论同步升温，交易者正在重新定价 9 月议息窗口。',
    labels: ['Prediction Markets', 'Macro & Financial Markets', 'Fast Rising'],
    basis: 'market',
    basisLabel: '实时市场',
    priority: 'immediate',
    age: '18 分钟前',
    reason: '同一主题在预测市场账号与宏观账号中同时出现，且近一轮讨论热度明显上升。',
    productBridge: '适合承接为“用市场概率观察政策预期变化”的教育型内容。',
    evidence: ['Polymarket 概率盘口刷新', '宏观账号引用 FOMC 预期变化', 'X 讨论量在短时窗口增加'],
    angles: [
      '从预测市场概率解释“降息预期如何被交易出来”。',
      '做一张 9 月 FOMC 关键变量清单，帮助用户持续观察。',
      '比较市场概率与传统机构预测之间的差异。',
    ],
    risk: '政策预期变化快，需要标注时间窗口，避免把概率表达成确定结论。',
  },
  {
    id: 'rec-openai-api',
    title: '开发者集中讨论 OpenAI 新 API 传闻',
    summary: 'AI 开发者社区围绕模型接口、价格与工具链迁移出现高频讨论。',
    labels: ['AI', 'Technology', 'Topic Circle'],
    basis: 'product',
    basisLabel: '产品价值',
    priority: 'today',
    age: '42 分钟前',
    reason: '多个开发者账号围绕同一 API 变化展开讨论，适合提炼产品使用场景。',
    productBridge: '适合产出“开发者如何判断是否迁移新 API”的实用分析。',
    evidence: ['开发者账号连续发帖', '讨论集中在价格、上下文长度和工具调用', '部分帖子出现较高收藏'],
    angles: [
      '拆解 API 变化可能影响哪些开发者工作流。',
      '整理一份迁移前需要确认的成本与能力清单。',
      '用一个真实任务对比旧接口和新接口的适用边界。',
    ],
    risk: '目前仍包含传闻成分，需要等待官方信息或明确标注来源不确定。',
  },
  {
    id: 'rec-election-market',
    title: '美国参议院选情预测出现快速波动',
    summary: '预测市场与政治账号同时提到关键州候选人的筹款和支持率变化。',
    labels: ['Politics & Elections', 'Prediction Markets', 'Multi-region'],
    basis: 'heat',
    basisLabel: '公共热度',
    priority: 'immediate',
    age: '1 小时前',
    reason: '政治事件触发了公共讨论，并向预测市场价格波动传导。',
    productBridge: '适合承接为“新闻事件如何改变市场预期”的案例型内容。',
    evidence: ['媒体账号发布竞选动态', '预测市场合约交易量增加', '相关关键词进入区域讨论'],
    angles: [
      '用时间线解释新闻、舆论和市场概率的先后关系。',
      '围绕“单条新闻能否改变预测市场”提出讨论。',
      '比较不同平台用户对同一政治事件的解读差异。',
    ],
    risk: '政治内容需要控制表达边界，不做倾向性断言。',
  },
  {
    id: 'rec-concept-video',
    title: '“一句话拆复杂概念”内容结构快速走红',
    summary: '多个内容账号用短句冲突和三段解释结构拆解复杂概念，传播效率明显高于长解释。',
    labels: ['Technology', '产品价值', '今日处理'],
    basis: 'product',
    basisLabel: '产品价值',
    priority: 'today',
    age: '1 小时前',
    reason: '内容结构本身具备复用价值，可以迁移到产品教育和热点解释场景。',
    productBridge: '适合沉淀成通用内容 Skill：先抛冲突，再给判断，再给行动建议。',
    evidence: ['多个账号复用相似结构', '评论集中在“讲清楚了”', '收藏与转发比例高于普通解释帖'],
    angles: [
      '把复杂市场概念压缩成一句冲突式开头。',
      '用三段式解释降低新用户理解门槛。',
      '把该结构沉淀为可复用内容模板。',
    ],
    risk: '不能只复制表达壳，需要保留事实准确性和上下文。',
  },
  {
    id: 'rec-agent-security',
    title: '全球多地同时讨论 AI Agent 安全事故',
    summary: '多个圈层账号提到 Agent 权限、工具调用和数据泄露风险，讨论从技术圈扩散到运营圈。',
    labels: ['AI', '公共热度', '立即响应'],
    basis: 'heat',
    basisLabel: '公共热度',
    priority: 'immediate',
    age: '22 分钟前',
    reason: '公共热度快速扩散，但尚未匹配直接市场，适合先做风险教育。',
    productBridge: '适合承接为“Agent 上线前需要检查哪些权限边界”。',
    evidence: ['AI 安全账号连续发帖', '开发者社群出现复盘讨论', '相关帖子评论区集中追问治理方案'],
    angles: [
      '整理 Agent 产品上线前的权限检查清单。',
      '用事故链路解释为什么工具调用需要审计。',
      '比较 Agent 安全与传统 API 安全的差异。',
    ],
    risk: '事故细节可能仍在更新，不能扩大化未确认影响。',
  },
]

export const inboxItems: ContextInboxItem[] = [
  {
    id: 'ctx-1',
    title: '某预测市场产品上线体育赛事合约，讨论集中在合规边界',
    source: '人工提交',
    quality: '可判断',
    status: 'done',
    statusText: '研判完成',
    conclusion: '已进入推荐',
    receivedAt: '今天 14:20',
    summary: '已抽取主体、动作、时间窗口和产品承接方向，可进入选题推荐。',
  },
  {
    id: 'ctx-2',
    title: 'AI Agent 开源项目发布新版本，开发者反馈部署复杂度降低',
    source: 'GitHub',
    quality: '可判断',
    status: 'working',
    statusText: '研判中',
    conclusion: '待判断',
    receivedAt: '今天 13:48',
    summary: '正在补充版本差异、社区反馈和是否具备内容响应价值。',
  },
  {
    id: 'ctx-3',
    title: '加密监管听证会临近，但缺少明确议程与核心参与方',
    source: '搜索结果',
    quality: '需补充',
    status: 'missing',
    statusText: '需要补充',
    conclusion: '暂不推荐',
    receivedAt: '今天 12:16',
    summary: '时间信息存在，但缺少议程、主体和可承接角度，需要补充来源。',
  },
  {
    id: 'ctx-4',
    title: '“一句话拆复杂概念”内容结构走红',
    source: '人工提交',
    quality: '可判断',
    status: 'done',
    statusText: '研判完成',
    conclusion: '已进入推荐',
    receivedAt: '1 小时前',
    summary: '结构可复用，已识别为内容方法类机会。',
  },
  {
    id: 'ctx-5',
    title: '某娱乐事件引发集中讨论',
    source: '外部 API',
    quality: '充分',
    status: 'done',
    statusText: '研判完成',
    conclusion: '暂不推荐',
    receivedAt: '1 小时前',
    summary: '热度成立，但与当前产品承接关系较弱。',
  },
  {
    id: 'ctx-6',
    title: 'AI Agent 开源工具数量快速增长',
    source: '热点情报中心',
    quality: '充分',
    status: 'pending',
    statusText: '待解析',
    conclusion: '待判断',
    receivedAt: '2 小时前',
    summary: '等待 Agent 汇总项目来源、增长证据和可复用洞察。',
  },
]

export const decisionRecords: DecisionRecord[] = [
  {
    id: 'record-1',
    title: '美联储 9 月降息概率升至 72%',
    basis: '实时市场',
    result: 'adopted',
    resultText: '直接采用',
    angle: '用预测市场概率解释政策预期变化。',
    note: '角度清晰，证据链完整，已进入内容生产。',
    regen: 0,
    operator: 'Rachel',
    time: '今天 15:10',
    timeline: ['初版推荐生成', '运营确认采用', '写入决策记录'],
  },
  {
    id: 'record-2',
    title: 'OpenAI 新 API 传闻引发开发者讨论',
    basis: '产品价值',
    result: 'edited',
    resultText: '修改后采用',
    angle: '从开发者迁移成本角度拆解 API 变化。',
    note: '补充了不确定性提示后采用。',
    regen: 1,
    operator: 'Mia',
    time: '今天 11:32',
    timeline: ['初版推荐生成', '补充官方来源要求', '修改后采用'],
  },
  {
    id: 'record-3',
    title: '某 Meme 币短时涨幅进入社区热议',
    basis: '公共热度',
    result: 'rejected',
    resultText: '不采用',
    angle: '无可采用角度',
    note: '事实依据弱，且与当前账号定位不匹配。',
    regen: 2,
    operator: 'Jason',
    time: '昨天 18:06',
    timeline: ['初版推荐生成', '两次重新推荐', '运营拒绝'],
  },
  {
    id: 'record-4',
    title: '某预测市场结果引发大规模讨论',
    basis: '公共热度 + 实时市场',
    result: 'adopted',
    resultText: '直接采用',
    angle: '结果出现后，事前市场判断与真实结果如何对应？',
    note: '首轮角度可直接使用',
    regen: 0,
    operator: 'Mia',
    time: '今天 09:21',
    timeline: ['事件进入推荐', '运营确认', '直接采用'],
  },
  {
    id: 'record-5',
    title: '竞品上线概率解释功能',
    basis: '产品价值',
    result: 'adopted',
    resultText: '直接采用',
    angle: '概率数字之外，用户真正需要怎样的事件解释？',
    note: '直接命中当前增长目标',
    regen: 0,
    operator: 'Rachel',
    time: '今天 08:50',
    timeline: ['竞品信号进入收件箱', 'Agent 形成选题', '运营采用'],
  },
]
