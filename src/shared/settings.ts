export type ExportStrategy = 'zip' | 'inline'

export type Settings = {
  exportStrategy: ExportStrategy
  filenameTemplate: string // {title}-{date}-{site}
  removeTrackingParams: boolean
}

export const defaultSettings: Settings = {
  exportStrategy: 'inline',
  filenameTemplate: '{title}-{date}-{site}',
  removeTrackingParams: true
}

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (res) => {
      resolve(res as Settings)
    })
  })
}

export async function setSettings(next: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(next, () => resolve())
  })
}

export function applyFilenameTemplate(template: string, ctx: { title: string; date: string; site: string }): string {
  return template
    .replace('{title}', ctx.title)
    .replace('{date}', ctx.date)
    .replace('{site}', ctx.site)
}

export function stripTrackingParams(inputUrl: string, enabled: boolean): string {
  if (!enabled) return inputUrl
  try {
    const u = new URL(inputUrl)
    const paramsToRemove = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','spm']
    paramsToRemove.forEach((k) => u.searchParams.delete(k))
    return u.toString()
  } catch {
    return inputUrl
  }
}