// Feature: mileage-management-system, Property 14: Toggle de tema alterna e persiste
// Validates: Requirements 9.3, 9.4
import fc from 'fast-check';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { ThemeProvider } from '../../components/shared/ThemeProvider';

// Helper consumer component
function ThemeConsumer({ onRender }: { onRender: (theme: string, toggle: () => void) => void }) {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  onRender(ctx.theme, ctx.toggleTheme);
  return null;
}

describe('Property 14: Toggle de tema alterna corretamente e persiste', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset dark class
    document.documentElement.classList.remove('dark');
  });

  it('tema alterna dark↔light a cada acionamento e persiste no localStorage', () => {
    // Feature: mileage-management-system, Property 14: Toggle de tema alterna corretamente
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // number of toggles
        (n) => {
          // Clear state between runs
          localStorage.clear();
          document.documentElement.classList.remove('dark');

          let capturedTheme = '';
          let capturedToggle: (() => void) | null = null;

          const { unmount } = render(
            <ThemeProvider>
              <ThemeConsumer onRender={(theme, toggle) => {
                capturedTheme = theme;
                capturedToggle = toggle;
              }} />
            </ThemeProvider>
          );

          // Initial state: light (default when localStorage is empty)
          expect(capturedTheme).toBe('light');
          expect(localStorage.getItem('theme')).toBe('light');

          // Toggle n times and verify alternation + localStorage sync
          for (let i = 0; i < n; i++) {
            const expectedTheme = i % 2 === 0 ? 'dark' : 'light';
            act(() => { capturedToggle?.(); });
            expect(capturedTheme).toBe(expectedTheme);
            expect(localStorage.getItem('theme')).toBe(expectedTheme);
          }

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
