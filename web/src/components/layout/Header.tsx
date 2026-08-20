import * as React from 'react'
import { Menu, Moon, Sun, UserRound, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { ProfileDialog } from '../shared/ProfileDialog'
import { cn } from '../../lib/utils'

interface HeaderProps {
  onMenuToggle: () => void
}

/**
 * Header — sticky top bar with hamburger toggle, app name, and the current
 * user's avatar menu (profile, theme, logout).
 * Requirements: 9.2, 11.3
 */
export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = React.useState(false)

  const roleLabel =
    user?.role === 'ADMIN' ? 'Admin' : user?.role === 'FUNCIONARIO' ? 'Team' : 'Usuário'
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?'

  async function handleLogout() {
    await logout()
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 w-full items-center',
        'border-b border-border bg-background/95 backdrop-blur-sm',
        'px-4 gap-3'
      )}
    >
      {/* Hamburger — visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* App name — visible on mobile (when sidebar is hidden) */}
      <span className="md:hidden text-base font-semibold tracking-tight select-none">
        Mundo Milhas
      </span>

      {/* Spacer pushes right-side items to the end */}
      <div className="flex-1" />

      {/* User avatar menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Menu do usuário"
            >
              <span className="flex max-w-[9rem] flex-col items-end text-right">
                <span className="w-full truncate text-sm font-medium leading-tight text-foreground">
                  {user.name}
                </span>
                <span className="w-full truncate text-xs leading-tight text-muted-foreground">
                  {roleLabel}
                </span>
              </span>
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                <AvatarFallback className="text-sm font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  )
}
