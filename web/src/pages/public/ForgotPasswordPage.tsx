import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, Loader2, AlertCircle, MailCheck } from 'lucide-react'
import { apiPost } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

/**
 * ForgotPasswordPage — public route /esqueci-senha
 *
 * Self-service password recovery entry point. Always shows the same generic
 * confirmation regardless of whether the email matches an account — the
 * backend (`POST /auth/forgot-password`) is built the same way, so this page
 * never reveals which emails are registered.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um e-mail válido.')
      return
    }
    setEmailError('')

    setIsSubmitting(true)
    try {
      await apiPost('/auth/forgot-password', { email: email.trim() })
    } catch {
      // Intentionally ignored — the confirmation screen is shown regardless,
      // so the response never reveals whether the email exists or not.
    } finally {
      setIsSubmitting(false)
      setSubmitted(true)
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
            Recuperar senha
          </p>
        </div>

        {submitted ? (
          <div className="px-8 pb-8 space-y-4 text-center">
            <div className="flex justify-center">
              <MailCheck className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-sm text-foreground">
              Se este email estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Voltar para o login</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de recuperação de senha"
            className="px-8 pb-6 space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Informe o e-mail da sua conta e enviaremos um link para você definir uma nova senha.
            </p>

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
                <p id="email-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {emailError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando…
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to="/login" className="hover:text-foreground hover:underline">
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
