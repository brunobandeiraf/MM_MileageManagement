import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // 1. Still validating the session — show a centered full-screen spinner
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Carregando..."
        />
      </div>
    )
  }

  // 2. No authenticated user — redirect to /login preserving the intended destination
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  // 3. Authenticated but lacks the required role — send them to their home
  // page instead of stranding them on a bare error screen. This also covers
  // the case where a USER is bounced through /login?redirect=/usuarios (e.g.
  // an old bookmark) and would otherwise land straight back on a 403.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // 4. All checks passed — render the protected content
  return <>{children}</>
}
