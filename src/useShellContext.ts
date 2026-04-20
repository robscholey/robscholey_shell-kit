import { useState, useEffect, useCallback, useRef } from 'react';
import { useShellKitConfig } from './ShellKitProvider';
import { isInIframe } from './isInIframe';
import { PROTOCOL_VERSION, parseShellMessage } from './messages';
import type {
  ShellUser,
  ShellTheme,
  Accent,
  AccentChangeMessage,
  JWTRefreshRequestMessage,
  RequestShellContextMessage,
  ThemeChangeMessage,
} from './messages';

/** The state returned by the {@link useShellContext} hook. */
export interface ShellContextState {
  /** Whether the app is running inside the shell iframe. */
  isEmbedded: boolean;
  /** Whether the shell wants the child to show a back button. */
  showBackButton: boolean;
  /** The current authenticated user, or null. */
  user: ShellUser | null;
  /** The current JWT, or null if unauthenticated. */
  jwt: string | null;
  /** Whether the session is still valid (becomes false on session-ended). */
  isSessionValid: boolean;
  /** The sub-path the shell wants the child to navigate to on mount. */
  subPath: string | null;
  /** The current colour theme as set by the shell. */
  theme: ShellTheme;
  /** The current accent as set by the shell. Defaults to `'teal'` until the shell sends one. */
  accent: Accent;
  /** Sends a request-jwt-refresh message to the shell. */
  requestJWTRefresh: () => void;
  /** Requests a theme change from the shell. The shell is the source of truth and broadcasts to all iframes. */
  requestThemeChange: (theme: ShellTheme) => void;
  /** Requests an accent change from the shell. The shell is the source of truth and broadcasts to all iframes. */
  requestAccentChange: (accent: Accent) => void;
}

/** Callback invoked when the shell tells the child to navigate to a specific path. */
export type NavigateToPathHandler = (path: string) => void;

/**
 * Hook that manages communication with the robscholey.com shell via postMessage.
 * Listens for `shell-context`, `jwt-refresh`, `session-ended`, `navigate-to-path`,
 * `theme-update`, and `accent-update` messages. Sends `request-shell-context` on
 * mount when running inside an iframe. Validates message origins against the
 * shell origin from the nearest {@link ShellKitProvider} and validates message
 * payloads through the zod-backed shell→child schema so malformed or
 * wrong-protocol messages drop silently (with a console warning for
 * recognised-type mismatches).
 *
 * @param onNavigateToPath - Optional callback invoked when the shell sends a `navigate-to-path` message (browser back/forward).
 */
export function useShellContext(onNavigateToPath?: NavigateToPathHandler): ShellContextState {
  const { shellOrigin } = useShellKitConfig();
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [user, setUser] = useState<ShellUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [subPath, setSubPath] = useState<string | null>(null);
  const [theme, setTheme] = useState<ShellTheme>('light');
  // `'teal'` is the canonical default accent. Used as the fallback when the
  // shell sends a v1 shell-context that predates the `accent` field (that
  // field is optional during the protocol transition period).
  const [accent, setAccent] = useState<Accent>('teal');

  // Keep the caller's navigate handler in a ref so the message-listener effect
  // can reference the latest callback without taking it as a dependency.
  // Without this, a fresh arrow function every render would re-subscribe on
  // every render, request the shell context again, and spin indefinitely.
  const onNavigateToPathRef = useRef(onNavigateToPath);
  useEffect(() => {
    onNavigateToPathRef.current = onNavigateToPath;
  }, [onNavigateToPath]);

  // Keep the shell origin in a ref so handlers don't need to resubscribe when
  // the provider config changes (which in practice it won't, but we shouldn't
  // tie message-listener identity to it).
  const shellOriginRef = useRef(shellOrigin);
  useEffect(() => {
    shellOriginRef.current = shellOrigin;
  }, [shellOrigin]);

  useEffect(() => {
    const inIframe = isInIframe();

    function handleMessage(event: MessageEvent) {
      if (event.origin !== shellOriginRef.current) return;
      const data = parseShellMessage(event.data);
      if (!data) return;

      if (data.type === 'shell-context') {
        setIsEmbedded(true);
        setShowBackButton(data.showBackButton);
        setUser(data.user);
        setJwt(data.jwt);
        setIsSessionValid(true);
        setSubPath(data.subPath);
        setTheme(data.theme);
        setAccent(data.accent ?? 'teal');
      }

      if (data.type === 'jwt-refresh') {
        setJwt(data.jwt);
      }

      if (data.type === 'session-ended') {
        setIsSessionValid(false);
        setJwt(null);
        setUser(null);
      }

      if (data.type === 'navigate-to-path') {
        onNavigateToPathRef.current?.(data.path);
      }

      if (data.type === 'theme-update') {
        setTheme(data.theme);
      }

      if (data.type === 'accent-update') {
        setAccent(data.accent);
      }
    }

    window.addEventListener('message', handleMessage);

    if (inIframe) {
      const message: RequestShellContextMessage = {
        type: 'request-shell-context',
        protocolVersion: PROTOCOL_VERSION,
      };
      window.parent.postMessage(message, shellOriginRef.current);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const requestJWTRefresh = useCallback(() => {
    if (isInIframe()) {
      const message: JWTRefreshRequestMessage = {
        type: 'request-jwt-refresh',
        protocolVersion: PROTOCOL_VERSION,
      };
      window.parent.postMessage(message, shellOriginRef.current);
    }
  }, []);

  const requestThemeChange = useCallback((newTheme: ShellTheme) => {
    if (isInIframe()) {
      const message: ThemeChangeMessage = {
        type: 'theme-change',
        protocolVersion: PROTOCOL_VERSION,
        theme: newTheme,
      };
      window.parent.postMessage(message, shellOriginRef.current);
    }
  }, []);

  const requestAccentChange = useCallback((newAccent: Accent) => {
    if (isInIframe()) {
      const message: AccentChangeMessage = {
        type: 'accent-change',
        protocolVersion: PROTOCOL_VERSION,
        accent: newAccent,
      };
      window.parent.postMessage(message, shellOriginRef.current);
    }
  }, []);

  return {
    isEmbedded,
    showBackButton,
    user,
    jwt,
    isSessionValid,
    subPath,
    theme,
    accent,
    requestJWTRefresh,
    requestThemeChange,
    requestAccentChange,
  };
}
