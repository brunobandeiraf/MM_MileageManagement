// Feature: mileage-management-system
// Property 11: Header exibe dados corretos do usuário autenticado
// Validates: Requirements 11.3
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthContext, type AuthContextValue, type User } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { Header } from '../Header';

const mockTheme = { theme: 'dark' as const, toggleTheme: vi.fn() };

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'name' | 'role'>): User {
  return {
    email: 'user@test.com',
    phone: '(11) 91234-5678',
    avatar_url: null,
    banks: [],
    ...overrides,
  };
}

function renderHeader(user: User | null) {
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
        <Header onMenuToggle={vi.fn()} />
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

describe('Property 11: Header exibe dados do usuário autenticado corretamente', () => {
  // Validates: Requirement 11.3
  it('exibe o nome e o papel "Admin" permanentemente, sem precisar abrir o menu', () => {
    const user = makeUser({ id: 'admin-id', name: 'Ana Administradora', role: 'ADMIN' });
    renderHeader(user);

    expect(screen.getByText('Ana Administradora')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('exibe o nome e o papel "Usuário" permanentemente, sem precisar abrir o menu', () => {
    const user = makeUser({ id: 'user-id', name: 'Um Usuário Comum', role: 'USER' });
    renderHeader(user);

    expect(screen.getByText('Um Usuário Comum')).toBeInTheDocument();
    expect(screen.getByText('Usuário')).toBeInTheDocument();
  });

  it('a barra do header mostra nome e papel permanentemente, ao lado do avatar', () => {
    const user = makeUser({ id: 'test-id', name: 'Nome Visível De Longe', role: 'ADMIN' });
    const { container, unmount } = renderHeader(user);

    expect(container.textContent).toContain('Nome Visível De Longe');
    expect(container.textContent).toContain('Admin');

    unmount();
  });
});
