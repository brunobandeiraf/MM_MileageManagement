import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

/**
 * AppLayout — wrapper for all authenticated pages.
 *
 * Sidebar state behaviour:
 *   - Desktop (≥768 px): open by default
 *   - Mobile  (<768 px): closed by default
 *
 * Requirements: 8.1, 8.2, 11.2
 */
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(
    () => window.innerWidth >= 768
  )

  // Keep the default state in sync when the viewport crosses the 768 px breakpoint.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    function handleChange(event: MediaQueryListEvent) {
      setIsSidebarOpen(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
