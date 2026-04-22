import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useShellContext } from '@/useShellContext';
import { ShellKitProvider } from '@/ShellKitProvider';

const SHELL_ORIGIN = 'https://robscholey.com';

function Wrapper({ children }: { children: ReactNode }) {
  return <ShellKitProvider config={{ shellOrigin: SHELL_ORIGIN }}>{children}</ShellKitProvider>;
}

beforeEach(() => {
  // Simulate being in an iframe
  Object.defineProperty(window, 'top', { value: {}, configurable: true });
  Object.defineProperty(window, 'parent', {
    value: { postMessage: vi.fn() },
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'top', { value: window, configurable: true });
  Object.defineProperty(window, 'parent', { value: window, configurable: true });
});

function dispatchShellMessage(data: Record<string, unknown>) {
  const event = new MessageEvent('message', {
    data,
    origin: SHELL_ORIGIN,
  });
  window.dispatchEvent(event);
}

describe('useShellContext', () => {
  it('sends request-shell-context on mount when in iframe', () => {
    renderHook(() => useShellContext(), { wrapper: Wrapper });

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      { type: 'request-shell-context', protocolVersion: 2 },
      SHELL_ORIGIN,
    );
  });

  it('processes shell-context messages', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'shell-context',
        protocolVersion: 2,
        isEmbedded: true,
        showBackButton: true,
        shellOrigin: SHELL_ORIGIN,
        jwt: 'test-jwt',
        user: { id: '1', name: 'Rob', type: 'owner' },
        subPath: '/projects/123',
      });
    });

    expect(result.current.isEmbedded).toBe(true);
    expect(result.current.showBackButton).toBe(true);
    expect(result.current.jwt).toBe('test-jwt');
    expect(result.current.user).toEqual({ id: '1', name: 'Rob', type: 'owner' });
    expect(result.current.subPath).toBe('/projects/123');
    expect(result.current.isSessionValid).toBe(true);
  });

  it('rejects messages from invalid origins', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      const event = new MessageEvent('message', {
        data: {
          type: 'shell-context',
          protocolVersion: 2,
          isEmbedded: true,
          showBackButton: true,
          shellOrigin: 'https://evil.com',
          jwt: 'evil-jwt',
          user: null,
          subPath: null,
        },
        origin: 'https://evil.com',
      });
      window.dispatchEvent(event);
    });

    expect(result.current.isEmbedded).toBe(false);
    expect(result.current.jwt).toBeNull();
  });

  it('updates jwt on jwt-refresh message', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'shell-context',
        protocolVersion: 2,
        isEmbedded: true,
        showBackButton: false,
        shellOrigin: SHELL_ORIGIN,
        jwt: 'old-jwt',
        user: null,
        subPath: null,
      });
    });

    act(() => {
      dispatchShellMessage({ type: 'jwt-refresh', protocolVersion: 2, jwt: 'new-jwt' });
    });

    expect(result.current.jwt).toBe('new-jwt');
  });

  it('clears session on session-ended message', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'shell-context',
        protocolVersion: 2,
        isEmbedded: true,
        showBackButton: false,
        shellOrigin: SHELL_ORIGIN,
        jwt: 'test-jwt',
        user: { id: '1', name: 'Rob', type: 'owner' },
        subPath: null,
      });
    });

    act(() => {
      dispatchShellMessage({ type: 'session-ended', protocolVersion: 2 });
    });

    expect(result.current.isSessionValid).toBe(false);
    expect(result.current.jwt).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('requestJWTRefresh sends postMessage', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      result.current.requestJWTRefresh();
    });

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      { type: 'request-jwt-refresh', protocolVersion: 2 },
      SHELL_ORIGIN,
    );
  });

  it('calls onNavigateToPath when shell sends navigate-to-path', () => {
    const onNavigate = vi.fn();
    renderHook(() => useShellContext(onNavigate), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'navigate-to-path',
        protocolVersion: 2,
        path: '/projects/456',
      });
    });

    expect(onNavigate).toHaveBeenCalledWith('/projects/456');
  });

  it('ignores messages that are not valid shell messages', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      const event = new MessageEvent('message', {
        data: 'not an object',
        origin: SHELL_ORIGIN,
      });
      window.dispatchEvent(event);
    });

    expect(result.current.isEmbedded).toBe(false);
  });

  it('drops messages with a mismatched protocolVersion and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'shell-context',
        // v1 — pre-Phase-I message, should be refused now that we're on v2
        protocolVersion: 1,
        isEmbedded: true,
        showBackButton: true,
        shellOrigin: SHELL_ORIGIN,
        jwt: 'test-jwt',
        user: null,
        subPath: null,
        // v1 carried `theme` here too — included in the test fixture so the
        // v1 payload is realistic, but it's unused by the v2 receiver.
        theme: 'light',
      });
    });

    expect(result.current.isEmbedded).toBe(false);
    expect(result.current.jwt).toBeNull();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0] ?? '')).toContain('protocol mismatch');
    warn.mockRestore();
  });

  it('drops structurally malformed messages and warns when the type is recognised', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({
        type: 'shell-context',
        protocolVersion: 2,
        // Missing every other required field.
      });
    });

    expect(result.current.isEmbedded).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('stays silent for unrelated postMessage traffic', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => useShellContext(), { wrapper: Wrapper });

    act(() => {
      dispatchShellMessage({ type: 'totally-unrelated', foo: 'bar' });
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
