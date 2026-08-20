import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { HomePage } from './pages/public/HomePage'
import { LoginPage } from './pages/public/LoginPage'
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage'
import { SetPasswordPage } from './pages/public/SetPasswordPage'
import { DashboardPage } from './pages/private/DashboardPage'
import { UsersPage } from './pages/private/UsersPage'
import { BanksPage } from './pages/private/BanksPage'
import { LoyaltyProgramsPage } from './pages/private/LoyaltyProgramsPage'
import { TransferParitiesPage } from './pages/private/TransferParitiesPage'
import { Toaster } from './components/ui/toaster'

/**
 * Application routing.
 *
 * Public routes   : /  /login
 * Private routes  : /dashboard               (all authenticated users)
 *                   /usuarios                (ADMIN and FUNCIONARIO)
 *                   /bancos                  (ADMIN)
 *                   /programas-fidelidade    (ADMIN)
 *                   /paridade-transferencia  (ADMIN)
 * Fallback        : * → /
 *
 * Requirements: 6.1, 6.2, 6.3, 7.1, 7.2
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/definir-senha" element={<SetPasswordPage />} />

        {/* Private routes — AppLayout wraps all authenticated pages via <Outlet /> */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FUNCIONARIO']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bancos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <BanksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programas-fidelidade"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LoyaltyProgramsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paridade-transferencia"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TransferParitiesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
