// Feature: mileage-management-system
// Property 11: Header exibe dados corretos do usuário autenticado
// Validates: Requirements 11.3
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext, type AuthContextValue, type User } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { Header } from '../Header';

const mockTheme = { theme: 'dark' as const, toggleTheme: vi.fn() };

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'name' | 'role'>): User {
  return {
    email: 'user@test.com',
    phone: '(11) 91234-5678',
    avatar_url: null,
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
  it('exibe nome e label "Admin" no menu do avatar para um usuário ADMIN', async () => {
    const user = makeUser({ id: 'admin-id', name: 'Ana Administradora', role: 'ADMIN' });
    renderHeader(user);

    await userEvent.click(screen.getByRole('button', { name: 'Menu do usuário' }));

    expect(await screen.findByText('Ana Administradora')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('exibe nome e label "Usuário" no menu do avatar para um usuário USER', async () => {
    const user = makeUser({ id: 'user-id', name: 'Um Usuário Comum', role: 'USER' });
    renderHeader(user);

    await userEvent.click(screen.getByRole('button', { name: 'Menu do usuário' }));

    expect(await screen.findByText('Um Usuário Comum')).toBeInTheDocument();
    expect(screen.getByText('Usuário')).toBeInTheDocument();
  });

  it('a barra do header nunca mostra o nome/papel de forma permanente (só dentro do menu)', () => {
    const user = makeUser({ id: 'test-id', name: 'Nome Visível De Longe', role: 'ADMIN' });
    const { container, unmount } = renderHeader(user);

    // Before opening the menu, the name must not appear anywhere in the header bar
    expect(container.textContent).not.toContain('Nome Visível De Longe');

    unmount();
  });
});
