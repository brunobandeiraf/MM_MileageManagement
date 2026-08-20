import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'

/**
 * Hook to access the authentication context.
 * Provides user, isLoading, login, and logout from AuthContext.
 *
 * Validates: Requirements 7.1
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
