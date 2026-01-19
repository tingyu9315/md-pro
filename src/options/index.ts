import { defaultSettings, getSettings, setSettings, type Settings } from '../shared/settings'

const root = document.getElementById('app')!

function render(state: Settings) {
  root.innerHTML = `
    <div style="padding:12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial">
      <h3 style="margin:0 0 12px">MD Pro 设置</h3>
      <label>导出策略：
        <select id="exportStrategy">
          <option value="zip">ZIP（.md + assets）</option>
          <option value="inline">内联图片（仅 .md）</option>
        </select>
      </label>
      <div style="height:8px"></div>
      <label>文件名模板：
        <input id="filenameTemplate" style="width: 320px" placeholder="{title}-{date}-{site}" />
      </label>
      <div style="height:8px"></div>
      <label>
        <input type="checkbox" id="removeTrackingParams" /> 移除链接追踪参数（UTM 等）
      </label>
      <div style="height:12px"></div>
      <button id="save">保存</button>
      <span id="status" style="margin-left:8px;color:green"></span>
      <p style="color:#666;margin-top:12px">可用占位：{title} {date} {site}</p>
    </div>
  `

  ;(document.getElementById('exportStrategy') as HTMLSelectElement).value = state.exportStrategy
  ;(document.getElementById('filenameTemplate') as HTMLInputElement).value = state.filenameTemplate
  ;(document.getElementById('removeTrackingParams') as HTMLInputElement).checked = state.removeTrackingParams

  document.getElementById('save')?.addEventListener('click', async () => {
    const next: Partial<Settings> = {
      exportStrategy: (document.getElementById('exportStrategy') as HTMLSelectElement).value as Settings['exportStrategy'],
      filenameTemplate: (document.getElementById('filenameTemplate') as HTMLInputElement).value || defaultSettings.filenameTemplate,
      removeTrackingParams: (document.getElementById('removeTrackingParams') as HTMLInputElement).checked
    }
    await setSettings(next)
    const status = document.getElementById('status')!
    status.textContent = '已保存'
    setTimeout(() => (status.textContent = ''), 1500)
  })
}

getSettings().then(render)