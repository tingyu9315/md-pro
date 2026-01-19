export function sanitizeFilename(input: string, maxLength = 120): string {
  const sanitized = input.replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim()
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function extFromMime(mime: string | undefined): string {
  if (!mime) return 'png'
  const type = mime.toLowerCase()
  if (type.includes('jpeg')) return 'jpg'
  if (type.includes('png')) return 'png'
  if (type.includes('gif')) return 'gif'
  if (type.includes('webp')) return 'webp'
  if (type.includes('svg')) return 'svg'
  if (type.includes('bmp')) return 'bmp'
  if (type.includes('x-icon') || type.includes('ico')) return 'ico'
  return 'png'
}

export function extFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const pathname = u.pathname.toLowerCase()
    const m = pathname.match(/\.([a-z0-9]+)$/)
    if (m) {
      const ext = m[1]
      if (['png','jpg','jpeg','gif','webp','svg','bmp','ico'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext
      }
    }
  } catch {}
  return null
}