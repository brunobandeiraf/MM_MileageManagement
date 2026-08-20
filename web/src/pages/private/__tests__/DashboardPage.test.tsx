// Feature: mileage-management-system, Property 20: Mensagem de boas-vindas contém o nome do usuário
import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue, type User } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { DashboardPage } from '../DashboardPage';

const mockTheme = { theme: 'dark' as const, toggleTheme: vi.fn() };

function renderDashboard(user: User) {
  const authValue: AuthContextValue = {
    user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    updateMyBanks: vi.fn(),
  };
  return render(
    <ThemeContext.Provider value={mockTheme}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

describe('Property 20: Mensagem de boas-vindas contém o nome do usuário autenticado', () => {
  it('para qualquer nome de usuário, a saudação contém o nome como substring', () => {
    /**
     * Validates: Requirement 11.1
     */
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          // Use printable strings without leading/trailing whitespace to match the trim behavior
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && s === s.trim()),
          role: fc.constantFrom('ADMIN' as const, 'USER' as const),
        }),
        (partialUser) => {
          const user: User = { email: 'user@test.com', phone: '(11) 91234-5678', avatar_url: null, banks: [], ...partialUser };
          const { unmount } = renderDashboard(user);
          const heading = screen.getByRole('heading', { level: 1 });
          expect(heading.textContent).toContain(user.name);
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
