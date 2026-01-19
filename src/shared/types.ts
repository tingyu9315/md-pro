export type ExtractResult = {
  title: string
  url: string
  markdown: string
  images: { src: string; dataUrl?: string; filename?: string }[]
}