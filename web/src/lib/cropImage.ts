export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

const MAX_OUTPUT_DIMENSION = 512
const JPEG_QUALITY = 0.9

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = src
  })
}

/**
 * Draws only the cropped region the user selected (via react-easy-crop) onto
 * a canvas, capped to MAX_OUTPUT_DIMENSION on its longest side, and returns
 * it as a JPEG data URI. This is what turns "the area/size the user picked"
 * into the actual uploaded image — the crop selection IS the size selection.
 */
export async function getCroppedImageDataUrl(imageSrc: string, crop: PixelCrop): Promise<string> {
  const image = await loadImage(imageSrc)

  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(crop.width, crop.height))
  const outputWidth = Math.round(crop.width * scale)
  const outputHeight = Math.round(crop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível processar a imagem.')
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
