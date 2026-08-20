import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Plane, LayoutDashboard, Users, Landmark, Award, ArrowLeftRight, Layers, ChevronDown, X } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isSidebarOpen: boolean
  onClose: () => void
}

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
    isActive
      ? 'bg-primary/10 font-medium text-primary'
      : 'text-muted-foreground hover:bg-blue-50 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
  )

const SUB_NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md py-2 pl-9 pr-3 text-sm transition-colors',
    isActive
      ? 'bg-primary/10 font-medium text-primary'
      : 'text-muted-foreground hover:bg-blue-50 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
  )

// Cadastros grouped under one submenu — Bancos, Programas de Fidelidade de
// Bancos e Paridade de Transferência hoje; futuras entradas (Companhias
// Aéreas, Programas de Fidelidade de Cia Aérea) entram aqui como novos itens,
// sem crescer o menu principal.
const CADASTROS_ROUTES = ['/bancos', '/programas-fidelidade', '/paridade-transferencia']

export function Sidebar({ isSidebarOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()

  const isCadastrosRouteActive = CADASTROS_ROUTES.some((route) => location.pathname.startsWith(route))
  const [isCadastrosOpen, setIsCadastrosOpen] = React.useState(isCadastrosRouteActive)

  // Keep the submenu open whenever navigation lands on one of its routes
  // (e.g. a direct link or browser back/forward), without fighting a manual toggle.
  React.useEffect(() => {
    if (isCadastrosRouteActive) setIsCadastrosOpen(true)
  }, [isCadastrosRouteActive])

  const closeOnMobile = () => {
    if (window.innerWidth < 768) onClose()
  }

  const sidebarContent = (
    <aside
      className={cn(
        'flex h-screen w-64 flex-col border-r border-border',
        'bg-white dark:bg-slate-900',
      )}
    >
      {/* Top Section — Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <Plane className="h-7 w-7 text-blue-600 dark:text-amber-500" aria-hidden="true" />
          <div>
            <p className="text-base font-bold leading-tight text-foreground">
              Mundo Milhas
            </p>
            <p className="text-xs leading-tight text-muted-foreground">
              Gestão de Milhas
            </p>
          </div>
        </div>

        {/* Close button — only visible on mobile */}
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4" aria-label="Navegação principal">
        <ul className="space-y-1">
          {/* Dashboard — always visible */}
          <li>
            <NavLink to="/dashboard" onClick={closeOnMobile} className={NAV_LINK_CLASS}>
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
              Dashboard
            </NavLink>
          </li>

          {/* Gestão de Usuários — ADMIN and FUNCIONARIO only, completely absent for USER */}
          {(user?.role === 'ADMIN' || user?.role === 'FUNCIONARIO') && (
            <li>
              <NavLink to="/usuarios" onClick={closeOnMobile} className={NAV_LINK_CLASS}>
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                Gestão de Usuários
              </NavLink>
            </li>
          )}

          {/* Cadastros — ADMIN only. Submenu grouping Bancos e Programas de
              Fidelidade de Bancos; ponto único de expansão para futuros
              cadastros (Cia Aérea, Programas de Fidelidade de Cia Aérea). */}
          {user?.role === 'ADMIN' && (
            <li>
              <button
                type="button"
                onClick={() => setIsCadastrosOpen((v) => !v)}
                aria-expanded={isCadastrosOpen}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isCadastrosRouteActive
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground hover:bg-blue-50 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
                )}
              >
                <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Cadastros</span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 transition-transform', isCadastrosOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              {isCadastrosOpen && (
                <ul className="mt-1 space-y-1">
                  <li>
                    <NavLink to="/bancos" onClick={closeOnMobile} className={SUB_NAV_LINK_CLASS}>
                      <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Bancos
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/programas-fidelidade" onClick={closeOnMobile} className={SUB_NAV_LINK_CLASS}>
                      <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Programas de Fidelidade de Bancos
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/paridade-transferencia" onClick={closeOnMobile} className={SUB_NAV_LINK_CLASS}>
                      <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Paridade de Transferência
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )

  return (
    <>
      {/*
       * Desktop (≥768px): sidebar is always visible as a static column.
       * We render it unconditionally inside the flex layout — AppLayout controls
       * whether this component is mounted at all on desktop.
       */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/*
       * Mobile (<768px): overlay sidebar that slides in from the left.
       * Rendered only when isSidebarOpen is true so the element is absent
       * from the DOM when closed (satisfies the DOM-absence requirement).
       */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
