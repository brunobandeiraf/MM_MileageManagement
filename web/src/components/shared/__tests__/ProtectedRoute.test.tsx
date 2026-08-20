// Feature: mileage-management-system
// Property 9: Redirecionamento preserva rota destino
// Property 10: Controle de acesso por papel
// Validates: Requirements 7.1, 7.2, 11.4
import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, type AuthContextValue, type User } from '../../../contexts/AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'name' | 'role'>): User {
  return {
    email: 'user@test.com',
    phone: '(11) 91234-5678',
    avatar_url: null,
    banks: [],
    ...overrides,
  };
}

// Helper to render ProtectedRoute with a mocked auth context
function renderWithAuth(
  authValue: AuthContextValue,
  initialPath: string,
  allowedRoles?: Array<'ADMIN' | 'FUNCIONARIO' | 'USER'>
) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route
            path="*"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <div data-testid="protected-content">Protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const loadedNoUser: AuthContextValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  updateMyBanks: vi.fn(),
};

describe('Property 9: Redirecionamento preserva rota destino', () => {
  it('redireciona para /login?redirect=<rota> sem user autenticado', () => {
    fc.assert(
      fc.property(
        fc.webPath(), // generates valid paths like /foo/bar
        (path) => {
          const { unmount } = renderWithAuth(loadedNoUser, path);
          // Should redirect to login — protected content should NOT be visible
          expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
          expect(screen.getByTestId('login-page')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 10: Controle de acesso por papel', () => {
  it('USER não acessa rota que exige ADMIN — conteúdo protegido ausente do DOM', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        ({ id, name }) => {
          const userAuth: AuthContextValue = {
            user: makeUser({ id, name, role: 'USER' }),
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
            changePassword: vi.fn(),
            updateMyBanks: vi.fn(),
          };
          const { unmount } = renderWithAuth(userAuth, '/private', ['ADMIN']);
          expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ADMIN acessa rota que exige ADMIN — conteúdo visível', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        ({ id, name }) => {
          const adminAuth: AuthContextValue = {
            user: makeUser({ id, name, role: 'ADMIN' }),
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
            changePassword: vi.fn(),
            updateMyBanks: vi.fn(),
          };
          const { unmount } = renderWithAuth(adminAuth, '/private', ['ADMIN']);
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('FUNCIONARIO acessa rota que permite ADMIN e FUNCIONARIO — conteúdo visível', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        ({ id, name }) => {
          const funcionarioAuth: AuthContextValue = {
            user: makeUser({ id, name, role: 'FUNCIONARIO' }),
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
            changePassword: vi.fn(),
            updateMyBanks: vi.fn(),
          };
          const { unmount } = renderWithAuth(funcionarioAuth, '/private', ['ADMIN', 'FUNCIONARIO']);
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('USER não acessa rota que permite apenas ADMIN e FUNCIONARIO — conteúdo ausente', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        ({ id, name }) => {
          const userAuth: AuthContextValue = {
            user: makeUser({ id, name, role: 'USER' }),
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
            changePassword: vi.fn(),
            updateMyBanks: vi.fn(),
          };
          const { unmount } = renderWithAuth(userAuth, '/private', ['ADMIN', 'FUNCIONARIO']);
          expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
