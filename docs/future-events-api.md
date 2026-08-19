# 未来事件运营排期 — 后端 API 契约

> 权威实现：前端 `src/api/futureEvents.ts`。本文件是后端实现时的契约依据；字段名与枚举值以此为准。

## 约定

- 基础路径：`/api`（前端 `client.ts` 已拼接），下面所有路径均省略 `/api` 前缀。
- JSON 字段与 query 参数一律 **camelCase**。
- 请求/响应均 `Content-Type: application/json`。
- 错误响应：非 2xx 时返回 `{ "message": string | string[] }`（前端 `client.ts` 归一化为 `ApiError`）。

## 枚举值

| 字段 | 值 |
|---|---|
| `confirmationLevel` | `fixed` \| `confirmed` \| `expected` \| `needs_verification` \| `changed` \| `cancelled` |
| `schedulePrecision` | `exact_time` \| `date` \| `date_range` \| `season_cycle` \| `unknown` |
| `expressionBoundary` | `factual` \| `qualified` \| `internal_only` \| `blocked` |
| `sourceType` | `opm` \| `bea` \| `bls` \| `fomc` \| `manual` |
| `entryMode` | `trend_trigger` \| `scheduled_manual_response` \| `scheduled_auto_response` |

## 来源与同步频率

| sourceType | 来源 | 同步频率 |
|---|---|---|
| `opm` | OPM 美国联邦假日 | 首次一次性 / CSV；年度刷新一次 |
| `bea` | BEA 发布时间表 | 每日一次 |
| `bls` | BLS 发布日历（Employment Situation / CPI / PPI / JOLTS / ECI） | 每日一次（解析 iCalendar） |
| `fomc` | FOMC 会议日历 | 每日一次 |
| `manual` | 人工导入 | 提交后即时校验 |

## 端点

### `GET /future-events`

列表。query（均可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `month` | `string` | `YYYY-MM` |
| `unassigned` | `boolean` | `true` 时返回无事实时间（未排期）的事件；与 `month` 互斥 |
| `confirmationLevel` | `ConfirmationLevel` | 确认状态 |
| `sourceType` | `FutureSourceType` | 来源类型 |
| `actionScoreMin` | `number` | Action Score 下限 |

响应：`FutureEvent[]`。

### `GET /future-events/:id`

详情。响应：`FutureEvent`。

### `GET /future-events/:id/heat`

热力数据。响应：`FutureEventHeat`。

### `GET /future-events/sources/status`

来源同步状态。响应：`SourceSyncStatus[]`。

### `POST /future-events`

人工导入。body：`CreateFutureEventPayload`（`title`、`sourceUrl` 必填；其余可选）。默认 `confirmationLevel=needs_verification`。响应：`FutureEvent`。

### `PUT /future-events/:id`

更新。body：`UpdateFutureEventPayload`（`CreateFutureEventPayload` 的 Partial）。响应：`FutureEvent`。

### `DELETE /future-events/:id`

删除/关闭。响应：`{ "status": string }`。

### `POST /future-events/sources/:source/resync`

重新同步某来源（局部恢复）。响应：`{ "status": string }`。

### `POST /future-events/:id/respond`

运营排期手动响应。body：`{ "kind": "content" | "campaign" }`。后端创建或复用 `scheduled_manual_response` Event，返回：

```json
{ "eventId": string, "next": "content" | "campaign" }
```

前端据此跳转到统一内容生成 / 营销方案输入。

### `POST /future-events/import`

批量导入（CSV）。body：`{ "csv": string }`（CSV 文本；列：事件名称、主体、事件类型、事实时间 ISO、来源URL，来源URL 必填）。响应：

```json
{ "imported": number, "skipped": number, "events": FutureEvent[] }
```

## 字段

### FutureEvent

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 排期事件 id |
| `title` | `string` | 标题 |
| `subject` | `string` | 主体 |
| `eventType` | `string` | 事件类型 |
| `factTime` | `string \| null` | 事实时间（ISO），与窗口分离；缺失为 `null` |
| `timezone` | `string` | 时区 |
| `schedulePrecision` | `SchedulePrecision` | 时间精度 |
| `confirmationLevel` | `ConfirmationLevel` | 确认状态 |
| `expressionBoundary` | `ExpressionBoundary` | 表达边界 |
| `evidence` | `EvidenceRecord[]` | 证据记录 |
| `windows` | `EventWindow` | 四类运营窗口 |
| `actionScore` | `ActionScore` | 五维 Action Score |
| `heat` | `FutureEventHeat` | 热力数据 |
| `relatedEventId` | `string \| null` | 关联 Event |
| `entryMode` | `EntryMode \| null` | 首次进入方式 |
| `ruleVersion` | `string` | 规则版本 |
| `createdAt` / `updatedAt` | `string` | 时间戳 |

### ActionScore

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | `number` | 0–100 总分 |
| `impact.scope` / `impact.relevance` / `impact.outcomeImportance` | `number` | 影响力子维度，各 0–10 |
| `evidence` | `number` | 证据可靠度 0–20 |
| `heatMomentum` | `number` | 热度动量 0–30 |
| `timeUrgency` | `number` | 时间紧迫度 0–10 |
| `contentReadiness` | `number` | 内容可执行性 0–10 |
| `version` | `string` | 评分版本 |

### EvidenceRecord

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 证据 id |
| `url` | `string` | 来源链接 |
| `sourceType` | `FutureSourceType` | 来源类型 |
| `verifiedAt` | `string` | 最后核验时间 |
| `claims` | `string[]` | 支持的事实主张 |
| `originalId?` | `string` | 原始标识 |

### EventWindow

四个字段均为 `[string, string] | null`（起止时间）：`monitoring` / `preheat` / `live` / `followUp`。

### FutureEventHeat

| 字段 | 类型 | 说明 |
|---|---|---|
| `query` | `string` | Heat Query |
| `queryVersion` | `string` | Heat Query 版本 |
| `monitoringStartedAt` | `string \| null` | 监测起始时间 |
| `buckets` | `PostCountBucket[]` | 6h 桶 |
| `last6h` / `prev6h` | `number` | 最近/前 6h 帖子量 |
| `growthPct` | `number \| null` | 增长百分比；前 6h 为 0 时为 `null`（前端显示「新出现」） |
| `intensityMultiple` | `number \| null` | 关注强度倍数；历史不足时为 `null` |
| `cumulative` | `number` | 累计讨论量 |

`PostCountBucket`：`{ "startAt": string, "endAt": string, "count": number }`。

### SourceSyncStatus

| 字段 | 类型 | 说明 |
|---|---|---|
| `source` | `FutureSourceType` | 来源 |
| `enabled` | `boolean` | 是否启用 |
| `lastSyncAt` | `string \| null` | 最近成功时间 |
| `status` | `'ok' \| 'error' \| 'disabled' \| 'pending'` | 健康状态 |
| `nextSyncAt` | `string \| null` | 下次同步时间 |
| `message?` | `string` | 附加信息 |
