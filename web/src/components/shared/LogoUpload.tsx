import * as React from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Camera, ImageOff, ZoomIn } from 'lucide-react'
import { getCroppedImageDataUrl } from '../../lib/cropImage'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog'

interface LogoUploadProps {
  logoUrl: string | null
  onChange: (dataUrl: string) => void
  disabled?: boolean
  alt: string
  idPrefix: string
}

/**
 * LogoUpload — click-to-replace logo picker for Bancos e Programas de
 * Fidelidade de Bancos. Selecting a file opens a crop dialog (drag to
 * reposition, slider to zoom) so the user picks exactly which area/size of
 * the image gets saved, instead of a blind auto-resize. `object-contain` on
 * a neutral background (rather than the avatar's cropped circle) keeps
 * non-square logos legible in the final thumbnail.
 */
export function LogoUpload({ logoUrl, onChange, disabled, alt, idPrefix }: LogoUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Crop dialog state — cropSrc !== null means the dialog is open
  const [cropSrc, setCropSrc] = React.useState<string | null>(null)
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.')
      return
    }

    setError(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCropSrc(URL.createObjectURL(file))
  }

  function closeCropDialog() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  async function handleConfirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return
    setIsSaving(true)
    try {
      const dataUrl = await getCroppedImageDataUrl(cropSrc, croppedAreaPixels)
      onChange(dataUrl)
      closeCropDialog()
    } catch {
      setError('Não foi possível processar a imagem selecionada.')
      closeCropDialog()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative"
          aria-label={`Alterar logo de ${alt}`}
          disabled={disabled}
        >
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-input bg-muted">
            {logoUrl ? (
              <img src={logoUrl} alt={alt} className="h-full w-full object-contain" />
            ) : (
              <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          id={`${idPrefix}-logo-input`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Crop dialog — opens automatically after picking a file */}
      <Dialog open={cropSrc !== null} onOpenChange={(open) => { if (!open) closeCropDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Logo</DialogTitle>
            <DialogDescription>
              Arraste a imagem para posicionar e use o controle abaixo para escolher o tamanho
              (zoom) exato antes de salvar.
            </DialogDescription>
          </DialogHeader>

          {cropSrc && (
            <>
              <div className="relative h-64 w-full overflow-hidden rounded-md bg-muted">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Tamanho da imagem"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-blue-600 dark:accent-amber-500"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCropDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmCrop} disabled={isSaving || !croppedAreaPixels}>
              {isSaving ? 'Salvando…' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
