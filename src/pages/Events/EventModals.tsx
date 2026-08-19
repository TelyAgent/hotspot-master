import type { EventItem } from '../../data/types'

export function CorrectModal({ e }: { e: EventItem }) {
  return (
    <>
      <div className="field">
        <label>一句话事实摘要</label>
        <textarea defaultValue={e.summary}></textarea>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>依据归属</label>
        <textarea defaultValue={e.urls.join('\n')}></textarea>
      </div>
      <div className="note">
        事实或依据变化后，所有未发布候选标记为“需要重新预检”；已发布内容不修改。
      </div>
    </>
  )
}

export function MergeModal({
  e,
  events,
}: {
  e: EventItem
  events: EventItem[]
}) {
  const other = events.find((x) => x.id !== e.id)
  return (
    <>
      <div className="field">
        <label>选择要合并的Event</label>
        <select>
          {events
            .filter((x) => x.id !== e.id)
            .map((x) => (
              <option key={x.id}>{x.title}</option>
            ))}
        </select>
      </div>
      <div className="two grid" style={{ marginTop: 12 }}>
        <div className="card">
          <b>当前Event</b>
          <p>{e.title}</p>
          <small>
            {e.urls.length}条依据 · 3条账号任务
          </small>
        </div>
        <div className="card">
          <b>候选Event</b>
          <p>{other?.title}</p>
          <small>2条依据 · 1条账号任务</small>
        </div>
      </div>
      <div className="note">
        <b>合并结果预览</b>
        <br />
        保留全部Signal、地区和去重后的依据；选择一个主Event；未发布任务重新检查关联；已发布结果不丢失。
      </div>
    </>
  )
}

export function SplitModal() {
  return (
    <>
      <p>按两个不同的核心事实重新分配依据，而不是复制整张Event卡片。</p>
      <div className="two grid">
        <div className="card">
          <b>新Event A</b>
          <input
            className="filter"
            style={{ width: '100%', margin: '8px 0' }}
            defaultValue="法案进入表决程序"
          />
          <label>
            <input type="checkbox" defaultChecked /> 依据1
          </label>
          <br />
          <label>
            <input type="checkbox" defaultChecked /> 依据2
          </label>
        </div>
        <div className="card">
          <b>新Event B</b>
          <input
            className="filter"
            style={{ width: '100%', margin: '8px 0' }}
            defaultValue="正式表决时间公布"
          />
          <label>
            <input type="checkbox" /> 依据1
          </label>
          <br />
          <label>
            <input type="checkbox" defaultChecked /> 依据3
          </label>
        </div>
      </div>
      <div className="note">
        拆分后重新生成各自摘要、关系和未发布任务；原始Signal保留审计关系。
      </div>
    </>
  )
}

export function RelateModal({
  e,
  events,
}: {
  e: EventItem
  events: EventItem[]
}) {
  return (
    <>
      <div className="field">
        <label>关联类型</label>
        <select>
          {['前置事件', '后续进展', '正式落地', '结果公布', '口径更正', '事件反转'].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>关联Event</label>
        <select>
          {events
            .filter((x) => x.id !== e.id)
            .map((x) => (
              <option key={x.id}>{x.title}</option>
            ))}
        </select>
      </div>
      <div className="note">最多保留3条最相关历史Event，仅作为内容上下文。</div>
    </>
  )
}
