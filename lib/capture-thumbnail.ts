import { toJpeg } from 'html-to-image'

const CAPTURE_WIDTH = 1280
const CAPTURE_HEIGHT = 720
const THUMBNAIL_WIDTH = 320
const THUMBNAIL_HEIGHT = 180
const JPEG_QUALITY = 0.7

export async function captureThumbnail(html: string): Promise<string> {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = `position:fixed;left:-9999px;width:${CAPTURE_WIDTH}px;height:${CAPTURE_HEIGHT}px;border:none;overflow:hidden;`
  document.body.appendChild(iframe)

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve()
      iframe.onerror = () => reject(new Error('Failed to load preview iframe'))
      iframe.srcdoc = html
    })

    const doc = iframe.contentDocument
    if (!doc?.body) {
      throw new Error('Cannot access iframe document')
    }

    const dataUrl = await toJpeg(doc.documentElement, {
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      quality: JPEG_QUALITY,
      pixelRatio: 1,
      skipAutoScale: true,
    })

    const canvas = document.createElement('canvas')
    canvas.width = THUMBNAIL_WIDTH
    canvas.height = THUMBNAIL_HEIGHT
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return dataUrl
    }

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load captured image'))
      img.src = dataUrl
    })

    ctx.drawImage(img, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } finally {
    document.body.removeChild(iframe)
  }
}
