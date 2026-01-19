import JSZip from 'jszip'

type DownloadRequest = {
  type: 'download'
  filename: string
  url: string // 可以是 dataURL
}

type ZipFile = { path: string; dataUrl: string }

type ZipDownloadRequest = {
  type: 'zip'
  filename: string
  files: ZipFile[]
}

type FetchImagesRequest = {
  type: 'fetch_images'
  urls: string[]
}

type Message = DownloadRequest | ZipDownloadRequest | FetchImagesRequest

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'mdpro-export', title: '导出为 Markdown', contexts: ['page'] })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'mdpro-export' && tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'MDPRO_EXPORT' })
    } catch (error) {
      console.error('Failed to send message to content script:', error)
      // 如果content script未响应，尝试重新注入
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/index.ts']
        })
        // 等待一下再发送消息
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id!, { type: 'MDPRO_EXPORT' })
          } catch (retryError) {
            console.error('Retry failed:', retryError)
          }
        }, 100)
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError)
      }
    }
  }
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'export_markdown') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'MDPRO_EXPORT' })
      } catch (error) {
        console.error('Failed to send message to content script:', error)
        // 如果content script未响应，尝试重新注入
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/index.ts']
          })
          // 等待一下再发送消息
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tab.id!, { type: 'MDPRO_EXPORT' })
            } catch (retryError) {
              console.error('Retry failed:', retryError)
            }
          }, 100)
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError)
        }
      }
    }
  }
})

async function ensureHostPermissions(urls: string[]): Promise<boolean> {
  const origins = Array.from(
    new Set(
      urls
        .map((u) => {
          try {
            const { protocol, host } = new URL(u)
            return `${protocol}//${host}/*`
          } catch {
            return null
          }
        })
        .filter(Boolean) as string[]
    )
  )
  if (origins.length === 0) return true

  const already = await new Promise<boolean>((resolve) => {
    chrome.permissions.contains({ origins }, (has) => {
      void chrome.runtime.lastError
      resolve(Boolean(has))
    })
  })
  if (already) return true

  return await new Promise((resolve) => {
    chrome.permissions.request({ origins }, (granted) => {
      const _ = chrome.runtime.lastError // eslint-disable-line @typescript-eslint/no-unused-vars
      resolve(Boolean(granted))
    })
  })
}

function parseDataUrlToBase64(dataUrl: string): { base64: string; mime: string } | null {
  if (!dataUrl.startsWith('data:')) return null
  const idx = dataUrl.indexOf(',')
  if (idx === -1) return null
  const header = dataUrl.slice(5, idx) // e.g. image/png;base64
  const mime = header.split(';')[0] || 'application/octet-stream'
  const base64 = dataUrl.slice(idx + 1)
  return { base64, mime }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  ;(async () => {
    if (msg.type === 'download') {
      await chrome.downloads.download({ url: msg.url, filename: msg.filename, saveAs: false })
      sendResponse({ ok: true })
      return
    }

    if (msg.type === 'fetch_images') {
      const ok = await ensureHostPermissions(msg.urls)
      if (!ok) return sendResponse({ ok: false, error: 'permissions_denied' })

      const tasks = msg.urls.map(async (url) => {
        try {
          const res = await fetch(url, { credentials: 'omit' })
          const blob = await res.blob()
          const dataUrl = await blobToDataUrl(blob)
          return { url, dataUrl }
        } catch (e) {
          return { url, error: String(e) }
        }
      })
      const settled = await Promise.all(tasks)
      sendResponse({ ok: true, results: settled })
      return
    }

    if (msg.type === 'zip') {
      const zip = new JSZip()
      for (const f of msg.files) {
        const parsed = parseDataUrlToBase64(f.dataUrl)
        if (parsed) {
          zip.file(f.path, parsed.base64, { base64: true })
        } else {
          const res = await fetch(f.dataUrl)
          const ab = await res.arrayBuffer()
          zip.file(f.path, ab)
        }
      }
      // 使用 STORE（不压缩）显著降低生成耗时
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
      const dataUrl = await blobToDataUrl(blob)
      await chrome.downloads.download({ url: dataUrl, filename: msg.filename, saveAs: false })
      sendResponse({ ok: true })
      return
    }
  })()
  return true
})