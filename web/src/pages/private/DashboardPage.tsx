import { Link } from 'react-router-dom'
import { BarChart3, Globe, TrendingUp, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Retorna saudação baseada no horário local.
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * DashboardPage — página inicial da área autenticada.
 * Requirements: 11.1, 11.2
 */
export function DashboardPage() {
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN'
  const canManageUsers = user?.role === 'ADMIN' || user?.role === 'FUNCIONARIO'
  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* ── Cabeçalho de boas-vindas ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {user?.name}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAdmin
            ? 'Você está acessando o painel de administração do sistema.'
            : 'Bem-vindo à sua área de gestão de milhas.'}
        </p>
      </div>

      {/* ── Cards de visão geral ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 — Bem-vindo à Mundo Milhas */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Globe className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold">Bem-vindo à Mundo Milhas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            A plataforma premium de gestão e maximização de milhas aéreas para
            viajantes e empresas que buscam o melhor rendimento dos seus pontos.
          </p>
        </div>

        {/* Card 2 — Plataforma de Gestão */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold">Plataforma de Gestão</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe, gerencie e otimize o seu portfólio de milhas em um único
            lugar, com visibilidade completa e relatórios em tempo real.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Relatórios em breve
            </span>
          </div>
        </div>

        {/* Card 3 — Gestão de Usuários (ADMIN e FUNCIONARIO) ou card informativo (USER) */}
        {canManageUsers ? (
          <Link
            to="/usuarios"
            className="group rounded-xl border border-amber-500/30 bg-card p-6 shadow-sm transition-all hover:border-amber-500/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold">Gestão de Usuários</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Adicione, edite e remova usuários do sistema. Gerencie permissões
              e garanta o controle de acesso à plataforma.
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 underline-offset-2 group-hover:underline dark:text-amber-400">
                Acessar gestão →
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold">Meus Relatórios</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Visualize o histórico das suas movimentações de milhas e
              acompanhe a evolução do seu saldo ao longo do tempo.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Em breve
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
