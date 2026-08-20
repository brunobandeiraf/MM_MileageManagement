import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'
import type { ThemeContextValue } from '../contexts/ThemeContext'

/**
 * Hook to consume the ThemeContext.
 * Must be used inside a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === null) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
        'Wrap a parent component in <ThemeProvider> to fix this error.'
    )
  }

  const { theme, toggleTheme } = context
  return { theme, toggleTheme }
}
