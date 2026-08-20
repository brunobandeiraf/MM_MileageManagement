import * as React from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatPhone } from '../../lib/phone'
import { resizeImageToDataUrl } from '../../lib/image'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * ProfileDialog — "Meu Perfil": self-service editing of the current user's
 * own name, email, phone and avatar. Available to every role via the Header
 * avatar menu.
 */
export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateProfile } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone)
      setAvatarUrl(user.avatar_url)
      setError(null)
    }
  }, [open, user])

  const initial = name ? name.charAt(0).toUpperCase() : '?'

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.')
      return
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setAvatarUrl(dataUrl)
    } catch {
      setError('Não foi possível processar a imagem selecionada.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      await updateProfile({ name, email, phone, avatar_url: avatarUrl })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Atualize sua foto, nome, email ou telefone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative"
              aria-label="Trocar foto de perfil"
              disabled={isSaving}
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                <AvatarFallback className="text-2xl font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <Input
              id="profile-phone"
              type="tel"
              placeholder="(11) 91234-5678"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              disabled={isSaving}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
