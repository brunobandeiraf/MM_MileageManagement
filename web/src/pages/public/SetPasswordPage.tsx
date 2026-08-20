import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plane, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiPost } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const MIN_PASSWORD_LENGTH = 8

/**
 * SetPasswordPage — public route /definir-senha?token=...
 *
 * Reached from the "set your password" invite/reset email sent on account
 * creation or admin-triggered reset. The token itself is the credential —
 * no login is required to reach this page.
 */
export function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): boolean {
    let valid = true

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      valid = false
    } else {
      setPasswordError('')
    }

    if (confirmPassword !== password) {
      setConfirmError('As senhas não coincidem.')
      valid = false
    } else {
      setConfirmError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalError('')

    if (!token) {
      setGlobalError('Link inválido ou incompleto.')
      return
    }

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await apiPost('/auth/set-password', { token, password })
      setSuccess(true)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Link inválido ou expirado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex flex-col items-center gap-2 px-8 pt-8 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Plane className="h-6 w-6 text-amber-500" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mundo Milhas
          </h1>
          <p className="text-sm text-muted-foreground">
            Defina sua senha
          </p>
        </div>

        {success ? (
          <div className="px-8 pb-8 space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-sm text-foreground">
              Senha definida com sucesso! Você já pode entrar com sua nova senha.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de definição de senha"
            className="px-8 pb-6 space-y-4"
          >
            {globalError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{globalError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError('')
                }}
                aria-describedby={passwordError ? 'password-error' : undefined}
                aria-invalid={passwordError ? 'true' : undefined}
                className={passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={isSubmitting}
              />
              {passwordError && (
                <p id="password-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmError) setConfirmError('')
                }}
                aria-describedby={confirmError ? 'confirm-password-error' : undefined}
                aria-invalid={confirmError ? 'true' : undefined}
                className={confirmError ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={isSubmitting}
              />
              {confirmError && (
                <p id="confirm-password-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {confirmError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Definindo…
                </>
              ) : (
                'Definir senha'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
