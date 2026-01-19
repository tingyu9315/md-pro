import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { Readability } from '@mozilla/readability'
import dayjs from 'dayjs'
import { sanitizeFilename, extFromMime, extFromUrl } from '../shared/utils'
import { getSettings, applyFilenameTemplate, stripTrackingParams } from '../shared/settings'

type FetchImagesResponse = {
  ok: boolean
  results?: { url: string; dataUrl?: string; error?: string }[]
}

function absolutizeUrl(url: string): string {
  try {
    return new URL(url, location.href).toString()
  } catch {
    return url
  }
}

function pickFromSrcset(srcset: string | null): string | null {
  if (!srcset) return null
  try {
    const parts = srcset
      .split(',')
      .map((p) => p.trim())
      .map((p) => {
        const [u, d] = p.split(/\s+/)
        const w = d?.endsWith('w') ? parseInt(d) : d?.endsWith('x') ? Math.floor(parseFloat(d) * 1000) : 0
        return { u, w }
      })
      .filter((x) => !!x.u)
    if (parts.length === 0) return null
    parts.sort((a, b) => b.w - a.w)
    return parts[0].u
  } catch {
    return null
  }
}

function resolveImgUrl(img: HTMLImageElement): string | null {
  const candidates = [img.getAttribute('src'), img.getAttribute('data-src')]
  const fromSrcset = pickFromSrcset(img.getAttribute('srcset') || img.getAttribute('data-srcset'))
  if (fromSrcset) candidates.unshift(fromSrcset)
  for (const c of candidates) {
    if (c) return absolutizeUrl(c)
  }
  return null
}

function collectImageUrls(root: HTMLElement): string[] {
  const urls = new Set<string>()
  root.querySelectorAll('img').forEach((img) => {
    const u = resolveImgUrl(img as HTMLImageElement)
    if (u) urls.add(u)
  })
  return Array.from(urls)
}

async function convertWebpToPng(dataUrl: string): Promise<string> {
  return await new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function exportCurrent() {
  try {
    const settings = await getSettings()
    const cloned = document.cloneNode(true) as Document
    const article = new Readability(cloned).parse()
    const container = document.createElement('div')
    container.innerHTML = article?.content || document.body.innerHTML

    container.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href')!
      a.setAttribute('href', stripTrackingParams(absolutizeUrl(href), settings.removeTrackingParams))
    })

    const imageUrls = collectImageUrls(container)
    const fetchRes: FetchImagesResponse = await chrome.runtime.sendMessage({
      type: 'fetch_images',
      urls: imageUrls
    })

    const urlToData = new Map<string, string>()
    fetchRes?.results?.forEach((r) => {
      if (r.dataUrl) urlToData.set(r.url, r.dataUrl)
    })

    const zipFiles: { path: string; dataUrl: string }[] = []
    const tasks: Promise<void>[] = []

    container.querySelectorAll('img').forEach((imgEl, index) => {
      const img = imgEl as HTMLImageElement
      const resolved = resolveImgUrl(img)
      if (!resolved) return
      const origDataUrl = urlToData.get(resolved)

      if (settings.exportStrategy === 'zip') {
        if (!origDataUrl) return
        const t = (async () => {
          let dataUrl = origDataUrl
          const urlExt = extFromUrl(resolved)
          const mime = origDataUrl.split(';')[0].replace('data:', '')
          let ext = (urlExt ?? extFromMime(mime)) || 'png'
          if (ext === 'webp') {
            dataUrl = await convertWebpToPng(origDataUrl)
            ext = 'png'
          }
          const filename = `assets/img-${index + 1}.${ext}`
          zipFiles.push({ path: filename, dataUrl })
          // 使用相对路径并移除 srcset，避免渲染器读取到远程地址
          img.setAttribute('src', `./${filename}`)
          img.removeAttribute('srcset')
          img.removeAttribute('data-srcset')
          if (!img.getAttribute('alt')) {
            img.setAttribute('alt', `image-${index + 1}`)
          }
        })()
        tasks.push(t)
      } else {
        img.setAttribute('src', resolved)
      }
    })

    // 确保所有图片替换完成后再生成 Markdown
    if (tasks.length) await Promise.all(tasks)

    const turndown = new TurndownService({ headingStyle: 'atx' })
    turndown.use(gfm)
    const title = article?.title || document.title
    const site = location.host
    const pageUrl = location.href
    const md = turndown.turndown(container.innerHTML)

    const frontmatter = `---\n` +
      `title: "${title.replace(/"/g, '\\"')}"\n` +
      `url: ${stripTrackingParams(pageUrl, settings.removeTrackingParams)}\n` +
      `date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n` +
      `site: ${site}\n` +
      `---\n\n`

    const markdownContent = frontmatter + md + '\n'
    const mdBlob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
    const mdDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(mdBlob)
    })

    const fileBase = sanitizeFilename(
      applyFilenameTemplate(settings.filenameTemplate, {
        title,
        date: dayjs().format('YYYY-MM-DD'),
        site
      })
    )

    if (settings.exportStrategy === 'zip') {
      await chrome.runtime.sendMessage({
        type: 'zip',
        filename: `${fileBase}.zip`,
        files: [{ path: `${fileBase}.md`, dataUrl: mdDataUrl }, ...zipFiles]
      })
    } else {
      await chrome.runtime.sendMessage({ type: 'download', filename: `${fileBase}.md`, url: mdDataUrl })
    }
  } catch (err) {
    alert(`导出失败：${err}`)
  }
}

// 初始化检查
console.log('MD Pro content script loaded')

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'MDPRO_EXPORT') {
    console.log('Received export request')
    exportCurrent().then(() => {
      sendResponse({ success: true })
    }).catch((error) => {
      console.error('Export failed:', error)
      sendResponse({ success: false, error: error.message })
    })
    return true // 保持消息通道开放以支持异步响应
  }
})