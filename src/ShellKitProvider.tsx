import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Accent, ShellTheme } from './messages';

/** Configuration options for shell-kit. */
export interface ShellKitConfig {
  /** The origin of the shell application. Used for postMessage origin validation. */
  shellOrigin: string;
}

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** localStorage key used to persist the active theme across reloads. */
const THEME_STORAGE_KEY = 'rs-theme';
/** localStorage key used to persist the active accent across reloads. */
const ACCENT_STORAGE_KEY = 'rs-accent';

/** The default theme used when nothing is persisted and no prop is provided. */
const DEFAULT_THEME: ShellTheme = 'dark';
/** The default accent used when nothing is persisted and no prop is provided. */
const DEFAULT_ACCENT: Accent = 'teal';

const THEMES: ReadonlySet<ShellTheme> = new Set<ShellTheme>(['light', 'dark']);
const ACCENTS_SET: ReadonlySet<Accent> = new Set<Accent>([
  'teal',
  'warm',
  'mono',
  'rose',
  'indigo',
  'betway',
  'fsgb',
]);

/** The value exposed on the provider context. */
interface ShellKitContextValue {
  config: ShellKitConfig;
  theme: ShellTheme;
  accent: Accent;
  setTheme: (theme: ShellTheme) => void;
  setAccent: (accent: Accent) => void;
}

/**
 * Internal context carrying shell-kit state. Exported for PageTheme and
 * other shell-kit internals that want to read the config without requiring
 * a provider (they fall through to a no-op when `ctx` is `null`). Consumers
 * outside shell-kit should use {@link useShellKitConfig} / {@link useTheme}
 * / {@link useAccent}.
 */
export const ShellKitContext = createContext<ShellKitContextValue | null>(null);

/** Props for the {@link ShellKitProvider} component. */
export interface ShellKitProviderProps {
  /** The shell-kit configuration for this sub-tree. */
  config: ShellKitConfig;
  /** Initial theme when nothing is persisted in localStorage. Defaults to `'dark'`. */
  defaultTheme?: ShellTheme;
  /** Initial accent when nothing is persisted in localStorage. Defaults to `'teal'`. */
  defaultAccent?: Accent;
  /** Child components that will have access to the configuration. */
  children: ReactNode;
}

/**
 * Reads an enum-valued value from localStorage, returning the fallback when
 * the key is absent, unreadable (SSR, disabled storage), or carries an
 * unrecognised value. Bad values are silently ignored rather than thrown so
 * a stale persisted key can never brick boot.
 */
function readStoredEnum<T extends string>(
  key: string,
  allowed: ReadonlySet<T>,
  fallback: T,
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value !== null && allowed.has(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Provides shell-kit configuration, theme, and accent state to descendant
 * hooks and components. Wrap your app once, near the root, with the shell
 * origin for the current environment.
 *
 * In Phase I the provider transitioned to a "page is the source of truth"
 * model: the layout SSR-renders `<html data-theme>` / `<html data-accent>`
 * from the admin-configured per-app default, and `<PageTheme>` overrides
 * those at the route level. The provider keeps local state + a
 * `localStorage` cache as a transitional bridge — Phase I.6 strips that out
 * entirely and removes the `useTheme` / `useAccent` hooks.
 *
 * Raises a browser `alert()` on mount when the configured `shellOrigin`
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
  defaultTheme = DEFAULT_THEME,
  defaultAccent = DEFAULT_ACCENT,
  children,
}: ShellKitProviderProps): React.ReactElement {
  // Lazy initialisers so we read localStorage once on mount rather than on
  // every render. Falls back to the prop default when the key is missing or
  // the stored value is not a recognised enum member.
  const [theme, setThemeState] = useState<ShellTheme>(() =>
    readStoredEnum<ShellTheme>(THEME_STORAGE_KEY, THEMES, defaultTheme),
  );
  const [accent, setAccentState] = useState<Accent>(() =>
    readStoredEnum<Accent>(ACCENT_STORAGE_KEY, ACCENTS_SET, defaultAccent),
  );

  // Pin the shell origin in a ref so the message listener doesn't need to
  // resubscribe when the provider re-renders with the same config identity.
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

  // Write theme + accent to <html>'s dataset and persist to localStorage on
  // every change. Kept in a single effect per concern so re-renders don't
  // stomp unrelated DOM state.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (incognito quotas, strict modes) — the
      // in-memory state still drives the UI so we tolerate the write miss.
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.accent = accent;
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      // See note above.
    }
  }, [accent]);

  // Phase I.5 removed the protocol's `theme-update` / `accent-update` /
  // `theme-change` / `accent-change` messages. Setters now update local
  // state (and persist via the html-dataset effect above); cross-iframe
  // theme propagation has been replaced by `<PageTheme>`'s page-theme
  // notification flowing child → shell, with the shell observing rather
  // than authoring.
  const setTheme = useCallback((next: ShellTheme) => {
    setThemeState(next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
  }, []);

  const value: ShellKitContextValue = { config, theme, accent, setTheme, setAccent };

  return <ShellKitContext.Provider value={value}>{children}</ShellKitContext.Provider>;
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

/** Return value of {@link useTheme}. */
export interface UseThemeResult {
  /** The active theme. */
  theme: ShellTheme;
  /** Set the theme. Persists to localStorage and notifies the shell when embedded. */
  setTheme: (theme: ShellTheme) => void;
}

/**
 * Returns the active theme and a setter. Persists across reloads via
 * `localStorage['rs-theme']` and, when mounted inside the shell iframe,
 * posts a `theme-change` message so the shell can broadcast the update.
 * Throws when called outside a {@link ShellKitProvider}.
 *
 * @returns The current theme and a setter.
 */
export function useTheme(): UseThemeResult {
  const ctx = useContext(ShellKitContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ShellKitProvider');
  }
  return { theme: ctx.theme, setTheme: ctx.setTheme };
}

/** Return value of {@link useAccent}. */
export interface UseAccentResult {
  /** The active accent. */
  accent: Accent;
  /** Set the accent. Persists to localStorage and notifies the shell when embedded. */
  setAccent: (accent: Accent) => void;
}

/**
 * Returns the active accent and a setter. Persists across reloads via
 * `localStorage['rs-accent']` and, when mounted inside the shell iframe,
 * posts an `accent-change` message so the shell can broadcast the update.
 * Throws when called outside a {@link ShellKitProvider}.
 *
 * @returns The current accent and a setter.
 */
export function useAccent(): UseAccentResult {
  const ctx = useContext(ShellKitContext);
  if (ctx === null) {
    throw new Error('useAccent must be used within a ShellKitProvider');
  }
  return { accent: ctx.accent, setAccent: ctx.setAccent };
}
