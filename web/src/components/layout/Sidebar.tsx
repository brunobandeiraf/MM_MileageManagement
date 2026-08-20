import { NavLink } from 'react-router-dom'
import { Plane, LayoutDashboard, Users, X } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isSidebarOpen: boolean
  onClose: () => void
}

export function Sidebar({ isSidebarOpen, onClose }: SidebarProps) {
  const { user } = useAuth()

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
            <NavLink
              to="/dashboard"
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 768) onClose()
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-blue-50 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
                )
              }
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
              Dashboard
            </NavLink>
          </li>

          {/* Gestão de Usuários — ADMIN and FUNCIONARIO only, completely absent for USER */}
          {(user?.role === 'ADMIN' || user?.role === 'FUNCIONARIO') && (
            <li>
              <NavLink
                to="/usuarios"
                onClick={() => {
                  if (window.innerWidth < 768) onClose()
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-blue-50 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
                  )
                }
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                Gestão de Usuários
              </NavLink>
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
