import { isInIframe } from './isInIframe';
import { PROTOCOL_VERSION } from './messages';
import type { NavigateToShellMessage } from './messages';

/**
 * Sends a navigate-to-shell postMessage to the parent shell.
 * No-op if not running inside an iframe.
 *
 * @param shellOrigin - The shell origin to post the message to. Read from
 *   {@link useShellKitConfig} at the call site and pass through.
 */
export function navigateToShell(shellOrigin: string): void {
  if (!isInIframe()) return;
  const message: NavigateToShellMessage = {
    type: 'navigate-to-shell',
    protocolVersion: PROTOCOL_VERSION,
  };
  window.parent.postMessage(message, shellOrigin);
}
