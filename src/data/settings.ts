export type SettingId =
  | 'twitter'
  | 'opportunityRules'

export const SET: [SettingId, string][] = [
  ['twitter', 'Twitter配置'],
  ['opportunityRules', '热点挖掘规则包'],
]

// 每行：[名称, 描述, 状态/值]
export const settingData: Record<SettingId, [string, string, string][]> = {
  twitter: [
    ['热搜榜采集', 'Worldwide / US / UK / Japan / Korea', '每2小时'],
    ['榜单形成事件', 'x-trend-event-formation', '启用'],
    ['重点主题追踪', '关键词、反例和账号列表', '启用'],
  ],
  opportunityRules: [
    ['规则包版本', '热搜、主题、YouTube、未来事件统一挖掘规则', '启用'],
    ['规则文档', '按来源拆分为多个 Markdown 子项', '可编辑'],
    ['保存策略', '修改保存为数据库草稿，不覆盖预设文件', '版本化'],
    ['短流程测试', '指定 Signal 验证规则效果', '启用'],
  ],
}

export const settingHelp: Record<SettingId, string> = {
  twitter:
    '集中配置 X 热搜榜采集频率、目标地区、榜单形成 Event 的 Markdown 工作流，以及重点主题追踪所需的关键词和账号。',
  opportunityRules:
    '配置热点挖掘 Agent 使用的规则包。每个规则文档作为子项独立查看和编辑，修改保存为草稿版本。',
}
