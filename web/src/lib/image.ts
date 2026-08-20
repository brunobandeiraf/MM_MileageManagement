const MAX_DIMENSION = 256
const JPEG_QUALITY = 0.85

/**
 * Resizes an image file down to at most MAX_DIMENSION on its longest side and
 * re-encodes it as a JPEG data URI. Keeps profile photo uploads small — a
 * multi-megabyte phone photo becomes a few tens of KB — since it's sent as a
 * base64 string in a JSON body (see api MAX_AVATAR_LENGTH / express.json limit).
 */
export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem.'))
    }

    img.src = objectUrl
  })
}
