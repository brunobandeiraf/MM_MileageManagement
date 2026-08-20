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
  const { user, updateProfile, changePassword } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  React.useEffect(() => {
    if (open && user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone)
      setAvatarUrl(user.avatar_url)
      setError(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordError(null)
      setPasswordSuccess(false)
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação não corresponde à nova senha.')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setIsChangingPassword(false)
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

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Alterar Senha</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Informe sua senha atual e a nova senha desejada.
          </p>

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Senha alterada com sucesso.</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={isChangingPassword}>
                {isChangingPassword ? 'Alterando…' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
