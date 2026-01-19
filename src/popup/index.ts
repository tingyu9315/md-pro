function $(id: string) {
  return document.getElementById(id) as HTMLElement
}

async function getSettings<T>(defaults: T): Promise<T> {
  return await new Promise((resolve) => chrome.storage.sync.get(defaults as any, (v) => resolve(v as T)))
}

async function setSettings(partial: Record<string, unknown>): Promise<void> {
  return await new Promise((resolve) => chrome.storage.sync.set(partial, () => resolve()))
}

const btn = $('export') as HTMLButtonElement
const strategyEl = $('strategy') as HTMLSelectElement

;(async () => {
  const cur = await getSettings({ exportStrategy: 'inline' })
  strategyEl.value = (cur as any).exportStrategy
})()

strategyEl.addEventListener('change', async () => {
  await setSettings({ exportStrategy: strategyEl.value })
})

btn?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'MDPRO_EXPORT' })
    window.close()
  }
})