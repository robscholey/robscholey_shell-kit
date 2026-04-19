/** Configuration options for shell-kit. */
export interface ShellKitConfig {
  /** The origin of the shell application. Used for postMessage origin validation. */
  shellOrigin: string;
}

const DEFAULT_CONFIG: ShellKitConfig = {
  shellOrigin: 'https://robscholey.com',
};

let currentConfig: ShellKitConfig = { ...DEFAULT_CONFIG };

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Configures shell-kit with custom settings. Call once at app startup.
 *
 * Also raises a browser `alert()` when the configured `shellOrigin` points at
 * localhost while the page is running on a non-localhost origin — that
 * combination usually means `NEXT_PUBLIC_SHELL_ORIGIN` (or equivalent) was
 * unset at build time. postMessage cross-origin checks would fail silently
 * otherwise, which is how admin-in-iframe bugs slip through. The alert is
 * intentionally loud because the failure mode is otherwise invisible except
 * to developers watching the console.
 *
 * @param config - Partial configuration; unset fields retain defaults.
 */
export function configure(config: Partial<ShellKitConfig>): void {
  currentConfig = { ...currentConfig, ...config };

  if (typeof window === 'undefined' || !config.shellOrigin) return;

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
}

/**
 * Returns the current shell-kit configuration.
 * @returns The active configuration object.
 */
export function getConfig(): ShellKitConfig {
  return currentConfig;
}

/** Resets configuration to defaults. Test-only — not part of the public API. */
export function _testResetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}
