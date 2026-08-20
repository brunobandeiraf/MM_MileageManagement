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
    changePassword: vi.fn(),
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
  it('exibe o nome permanentemente abaixo da foto e o papel "Admin" ao abrir o menu', async () => {
    const user = makeUser({ id: 'admin-id', name: 'Ana Administradora', role: 'ADMIN' });
    renderHeader(user);

    // The name sits below the avatar at all times, no click required
    expect(screen.getByText('Ana Administradora')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Menu do usuário' }));

    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  it('exibe o nome permanentemente abaixo da foto e o papel "Usuário" ao abrir o menu', async () => {
    const user = makeUser({ id: 'user-id', name: 'Um Usuário Comum', role: 'USER' });
    renderHeader(user);

    expect(screen.getByText('Um Usuário Comum')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Menu do usuário' }));

    expect(await screen.findByText('Usuário')).toBeInTheDocument();
  });

  it('a barra do header mostra o nome permanentemente, mas o papel só aparece dentro do menu', () => {
    const user = makeUser({ id: 'test-id', name: 'Nome Visível De Longe', role: 'ADMIN' });
    const { container, unmount } = renderHeader(user);

    // The name is always visible in the header bar, below the avatar
    expect(container.textContent).toContain('Nome Visível De Longe');
    // The role label stays hidden until the dropdown menu is opened
    expect(container.textContent).not.toContain('Admin');

    unmount();
  });
});
