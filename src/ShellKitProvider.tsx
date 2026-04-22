import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** Configuration options for shell-kit. */
export interface ShellKitConfig {
  /** The origin of the shell application. Used for postMessage origin validation. */
  shellOrigin: string;
}

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** The value exposed on the provider context. */
interface ShellKitContextValue {
  config: ShellKitConfig;
}

/**
 * Internal context carrying shell-kit configuration. Exported for
 * {@link PageTheme} and other shell-kit internals that want to read the
 * config without requiring a provider (they fall through to a no-op when
 * `ctx` is `null`). Consumers outside shell-kit should use
 * {@link useShellKitConfig}.
 */
export const ShellKitContext = createContext<ShellKitContextValue | null>(null);

/** Props for the {@link ShellKitProvider} component. */
export interface ShellKitProviderProps {
  /** The shell-kit configuration for this sub-tree. */
  config: ShellKitConfig;
  /** Child components that will have access to the configuration. */
  children: ReactNode;
}

/**
 * Provides shell-kit configuration to descendant hooks and components.
 * Wrap your app once near the root with the shell origin for the current
 * environment.
 *
 * Theme + accent are page-owned as of Phase I.6 — sub-app layouts render
 * them into `<html data-*>` via an SSR fetch of the admin-configured
 * per-app default, and {@link PageTheme} overrides at the route level.
 * There's no runtime state here, no localStorage, no html-dataset
 * authorship; the provider's only remaining responsibility is holding
 * `shellOrigin` for the hooks that need it (`useShellContext`, the
 * `PageTheme` postMessage poster, `ShellBackButton`, etc.).
 *
 * Also raises a browser `alert()` on mount when the configured `shellOrigin`
 * points at localhost while the page is running on a non-localhost origin —
 * that combination usually means `NEXT_PUBLIC_SHELL_ORIGIN` (or equivalent)
 * was unset at build time. postMessage cross-origin checks would fail
 * silently otherwise, which is how admin-in-iframe bugs slip through. The
 * alert is intentionally loud because the failure mode is otherwise invisible
 * except to developers watching the console.
 *
 * @param props - The provider props.
 * @returns A React element that provides shell-kit state to descendants.
 */
export function ShellKitProvider({
  config,
  children,
}: ShellKitProviderProps): React.ReactElement {
  // Pin the shell origin in a ref for any future effect that needs it
  // without re-subscribing on config-identity changes. Kept even though
  // the provider has no effects today — it's a trivial cost and future
  // hooks that want it won't need to retrofit.
  const shellOriginRef = useRef(config.shellOrigin);
  useEffect(() => {
    shellOriginRef.current = config.shellOrigin;
  }, [config.shellOrigin]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const providedOrigin = new URL(config.shellOrigin).origin;
      const pageOrigin = window.location.origin;
      if (
        LOCALHOST_ORIGIN_RE.test(providedOrigin) &&
        !LOCALHOST_ORIGIN_RE.test(pageOrigin)
      ) {
        window.alert(
          `[shell-kit] shellOrigin is configured as "${providedOrigin}" but this page is served from "${pageOrigin}". ` +
            `This almost always means the shell origin env var was unset at build time. ` +
            `postMessage to the parent will be rejected by the browser.`,
        );
      }
    } catch {
      window.alert(`[shell-kit] shellOrigin "${config.shellOrigin}" is not a valid URL.`);
    }
    // Boot-time warning: check once on mount, not on every config change.
  }, []);

  return <ShellKitContext.Provider value={{ config }}>{children}</ShellKitContext.Provider>;
}

/**
 * Returns the shell-kit configuration provided by the nearest
 * {@link ShellKitProvider} ancestor. Throws when called outside a provider.
 *
 * @returns The active shell-kit configuration.
 */
export function useShellKitConfig(): ShellKitConfig {
  const ctx = useContext(ShellKitContext);
  if (ctx === null) {
    throw new Error('useShellKitConfig must be used within a ShellKitProvider');
  }
  return ctx.config;
}
