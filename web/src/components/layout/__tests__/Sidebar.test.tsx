// Feature: mileage-management-system
// Property 12: Destaque visual do item ativo é exclusivo
// Property 13: Visibilidade de "Gestão de Usuários" por papel
// Validates: Requirements 8.5, 8.7
import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue, type User } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { Sidebar } from '../Sidebar';

const mockTheme = { theme: 'dark' as const, toggleTheme: vi.fn() };

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'name' | 'role'>): User {
  return {
    email: 'user@test.com',
    phone: '(11) 91234-5678',
    avatar_url: null,
    ...overrides,
  };
}

function renderSidebar(user: User, initialPath = '/dashboard') {
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
        <MemoryRouter initialEntries={[initialPath]}>
          <Sidebar isSidebarOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

// The Sidebar renders content twice: once for desktop (hidden md:block) and once for
// mobile overlay (when isSidebarOpen=true). We scope queries to the desktop aside
// to get a single, stable DOM node for assertions.
function getDesktopAside(container: HTMLElement): HTMLElement {
  // The desktop wrapper is the first child div with class "hidden md:block"
  const desktopWrapper = container.querySelector('.hidden.md\\:block');
  if (!desktopWrapper) throw new Error('Desktop sidebar wrapper not found');
  return desktopWrapper as HTMLElement;
}

describe('Property 12: Destaque visual do item ativo na Sidebar é exclusivo', () => {
  // Validates: Requirement 8.5
  // Scoped to the desktop aside to avoid counting the mobile overlay duplicate.
  it('exatamente 1 item tem classe de destaque ativo para rota /dashboard (ADMIN)', () => {
    const adminUser = makeUser({ id: 'test-id', name: 'Test Admin', role: 'ADMIN' });
    const { container, unmount } = renderSidebar(adminUser, '/dashboard');
    const aside = getDesktopAside(container);

    // Active class: bg-primary/10 is applied to the active NavLink
    const activeLinks = aside.querySelectorAll('a.bg-primary\\/10');
    expect(activeLinks.length).toBe(1);

    unmount();
  });

  it('exatamente 1 item tem classe de destaque ativo para rota /usuarios (ADMIN)', () => {
    const adminUser = makeUser({ id: 'test-id', name: 'Test Admin', role: 'ADMIN' });
    const { container, unmount } = renderSidebar(adminUser, '/usuarios');
    const aside = getDesktopAside(container);

    const activeLinks = aside.querySelectorAll('a.bg-primary\\/10');
    expect(activeLinks.length).toBe(1);

    unmount();
  });
});

describe('Property 13: Visibilidade de "Gestão de Usuários" é determinada pelo papel', () => {
  // Validates: Requirement 8.7
  it('item "Gestão de Usuários" está presente no DOM para qualquer usuário ADMIN', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constant('ADMIN' as const),
        }),
        (partialUser) => {
          const { container, unmount } = renderSidebar(makeUser(partialUser));
          const aside = getDesktopAside(container);

          // Link must be present in the DOM (not just hidden)
          const link = aside.querySelector('a[href="/usuarios"]');
          expect(link).not.toBeNull();

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('item "Gestão de Usuários" está presente no DOM para qualquer usuário FUNCIONARIO', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constant('FUNCIONARIO' as const),
        }),
        (partialUser) => {
          const { container, unmount } = renderSidebar(makeUser(partialUser));
          const aside = getDesktopAside(container);

          const link = aside.querySelector('a[href="/usuarios"]');
          expect(link).not.toBeNull();

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('item "Gestão de Usuários" está ausente do DOM para qualquer usuário USER', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constant('USER' as const),
        }),
        (partialUser) => {
          const { container, unmount } = renderSidebar(makeUser(partialUser));
          const aside = getDesktopAside(container);

          // Link must be completely absent from DOM, not just hidden
          const link = aside.querySelector('a[href="/usuarios"]');
          expect(link).toBeNull();

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
