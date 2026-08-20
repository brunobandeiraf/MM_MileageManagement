import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Plane, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

/**
 * LoginPage — public route /login
 *
 * - If already authenticated, redirects immediately to ?redirect= or /dashboard
 * - Submits via useAuth().login(email, password)
 * - Shows inline validation errors and a global error on failed login
 * - WCAG AA: every input is associated to its label via htmlFor/id, and to
 *   its error via aria-describedby
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */
export function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // While AuthContext is still resolving the session, render nothing to avoid flash
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" aria-label="Carregando" />
      </div>
    )
  }

  // Already authenticated — redirect immediately
  if (user) {
    const redirect = searchParams.get('redirect') ?? '/dashboard'
    return <Navigate to={redirect} replace />
  }

  function validate(): boolean {
    let valid = true

    if (!email.trim()) {
      setEmailError('O e-mail é obrigatório.')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um e-mail válido.')
      valid = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('A senha é obrigatória.')
      valid = false
    } else {
      setPasswordError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      const redirect = searchParams.get('redirect') ?? '/dashboard'
      navigate(redirect, { replace: true })
    } catch {
      setGlobalError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        {/* ── Card header ─────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 px-8 pt-8 pb-6">
          {/* Plane icon in amber — links back to the home page */}
          <Link
            to="/"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 transition-opacity hover:opacity-80"
            aria-label="Voltar para a página inicial"
          >
            <Plane className="h-6 w-6 text-amber-500" aria-hidden="true" />
          </Link>
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            Mundo Milhas
          </Link>
          <p className="text-sm text-muted-foreground">
            Faça login para continuar
          </p>
        </div>

        {/* ── Form ────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulário de login"
          className="px-8 pb-6 space-y-4"
        >
          {/* Global error banner */}
          {globalError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={emailError ? 'true' : undefined}
              className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={isSubmitting}
            />
            {emailError && (
              <p
                id="email-error"
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                {emailError}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                to="/esqueci-senha"
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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
              <p
                id="password-error"
                role="alert"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                {passwordError}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="border-t border-border px-8 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Acesso restrito a usuários autorizados
          </p>
        </div>
      </div>
    </div>
  )
}
