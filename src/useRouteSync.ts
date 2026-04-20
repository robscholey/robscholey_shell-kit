import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useShellKitConfig } from './ShellKitProvider';
import { isInIframe } from './isInIframe';
import { PROTOCOL_VERSION } from './messages';
import type { RouteChangeMessage } from './messages';

/**
 * Syncs the child app's current pathname to the shell via postMessage.
 * Requires Next.js (`next/navigation`). Call once in the root layout,
 * inside a {@link ShellKitProvider}.
 *
 * @example
 * ```tsx
 * // Next.js root layout
 * function RootLayout({ children }: { children: React.ReactNode }) {
 *   useRouteSync();
 *   return <>{children}</>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // For react-router, use this pattern instead of useRouteSync:
 * import { useLocation } from 'react-router-dom';
 * import { useShellKitConfig, PROTOCOL_VERSION } from '@robscholey/shell-kit';
 *
 * function RouteSync() {
 *   const { shellOrigin } = useShellKitConfig();
 *   const { pathname } = useLocation();
 *   useEffect(() => {
 *     if (window.self !== window.top) {
 *       window.parent.postMessage(
 *         { type: 'route-change', protocolVersion: PROTOCOL_VERSION, path: pathname },
 *         shellOrigin,
 *       );
 *     }
 *   }, [pathname, shellOrigin]);
 *   return null;
 * }
 * ```
 */
export function useRouteSync(): void {
  const { shellOrigin } = useShellKitConfig();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInIframe()) return;

    const message: RouteChangeMessage = {
      type: 'route-change',
      protocolVersion: PROTOCOL_VERSION,
      path: pathname,
    };
    window.parent.postMessage(message, shellOrigin);
  }, [pathname, shellOrigin]);
}
