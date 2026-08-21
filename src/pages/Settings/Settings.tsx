import { Menu } from 'antd'
import { useApp } from '../../context/AppContext'
import { SET } from '../../data/settings'
import { Head } from '../../components/ui'
import { SETTING_ITEMS } from './items'
import styles from './Settings.module.css'

export default function Settings() {
  const { setting, set } = useApp()
  const ActiveSetting = SETTING_ITEMS[setting]

  return (
    <>
      <Head
        title="系统设置"
        desc="每个“配置/修改”入口均展示它负责的字段、运行状态和规则影响。"
      />

      <div className={styles.settingsLayout}>
        <aside className={styles.settingsNav}>
          <Menu
            className={styles.settingsMenu}
            mode="inline"
            selectedKeys={[setting]}
            items={SET.map(([key, label]) => ({ key, label }))}
            onClick={({ key }) => set({ setting: key as typeof setting })}
          />
        </aside>

        <ActiveSetting />
      </div>
    </>
  )
}
