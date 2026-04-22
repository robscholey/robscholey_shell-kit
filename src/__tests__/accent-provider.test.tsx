import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ShellKitProvider, useAccent, useTheme } from '@/ShellKitProvider';

const SHELL_ORIGIN = 'https://robscholey.com';

function Wrapper({ children }: { children: ReactNode }) {
  return <ShellKitProvider config={{ shellOrigin: SHELL_ORIGIN }}>{children}</ShellKitProvider>;
}

beforeEach(() => {
  // Reset html dataset + storage between tests so assertions can't leak.
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.accent;
  window.localStorage.clear();
  // Default to not-in-iframe. Individual tests override.
  Object.defineProperty(window, 'top', { value: window, configurable: true });
  Object.defineProperty(window, 'parent', { value: window, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShellKitProvider theme + accent state', () => {
  it('applies defaultTheme and defaultAccent to the documentElement dataset', () => {
    render(
      <ShellKitProvider
        config={{ shellOrigin: SHELL_ORIGIN }}
        defaultTheme="light"
        defaultAccent="rose"
      >
        <span data-testid="child">child</span>
      </ShellKitProvider>,
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.accent).toBe('rose');
  });

  it('falls back to dark + teal when no defaults are provided', () => {
    render(
      <ShellKitProvider config={{ shellOrigin: SHELL_ORIGIN }}>
        <span />
      </ShellKitProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.accent).toBe('teal');
  });

  it('hydrates from localStorage when present, ignoring defaults', () => {
    window.localStorage.setItem('rs-theme', 'light');
    window.localStorage.setItem('rs-accent', 'indigo');

    render(
      <ShellKitProvider
        config={{ shellOrigin: SHELL_ORIGIN }}
        defaultTheme="dark"
        defaultAccent="teal"
      >
        <span />
      </ShellKitProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.accent).toBe('indigo');
  });

  it('ignores unrecognised localStorage values and uses defaults', () => {
    window.localStorage.setItem('rs-theme', 'neon');
    window.localStorage.setItem('rs-accent', 'cyberpunk');

    render(
      <ShellKitProvider config={{ shellOrigin: SHELL_ORIGIN }}>
        <span />
      </ShellKitProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.accent).toBe('teal');
  });

  it('setAccent updates state, dataset, and localStorage', () => {
    const { result } = renderHook(() => useAccent(), { wrapper: Wrapper });

    act(() => {
      result.current.setAccent('indigo');
    });

    expect(result.current.accent).toBe('indigo');
    expect(document.documentElement.dataset.accent).toBe('indigo');
    expect(window.localStorage.getItem('rs-accent')).toBe('indigo');
  });

  it('setTheme updates state, dataset, and localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('rs-theme')).toBe('light');
  });

  // The cross-iframe broadcast tests (apply theme-update / accent-update,
  // post theme-change / accent-change) covered the v1 shell-broadcast model
  // that Phase I.5 removed. Theme + accent are now page-owned: pages
  // declare via <PageTheme>, the shell observes via page-theme. There's no
  // shell→child theme push and no child→shell theme request in v2.

  it('useAccent throws when used outside a provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useAccent())).toThrow(
        /useAccent must be used within a ShellKitProvider/,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('useTheme throws when used outside a provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useTheme())).toThrow(
        /useTheme must be used within a ShellKitProvider/,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
