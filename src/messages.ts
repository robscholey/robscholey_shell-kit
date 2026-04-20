import { z } from 'zod';

/**
 * The wire-format version of the shell ↔ child postMessage protocol.
 *
 * Bump this whenever a breaking change lands on any message schema so older
 * shells and children refuse to talk to a newer peer instead of silently
 * misinterpreting a field. Receivers drop any message whose `protocolVersion`
 * does not match this constant.
 */
export const PROTOCOL_VERSION = 1;

const protocolVersion = z.literal(PROTOCOL_VERSION);

/** A user identity provided by the shell. */
export const shellUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['owner', 'named', 'anonymous']),
});

/** The active colour theme. */
export const shellThemeSchema = z.enum(['light', 'dark']);

/** Sent by the shell to provide the embedding context to a child app. */
export const shellContextMessageSchema = z.object({
  type: z.literal('shell-context'),
  protocolVersion,
  // Literal true — the shell only ever sends shell-context when the child is
  // embedded. A `false` here would indicate someone synthesising a context
  // message outside the iframe path, which is a bug worth catching at parse.
  isEmbedded: z.literal(true),
  showBackButton: z.boolean(),
  shellOrigin: z.string(),
  jwt: z.string().nullable(),
  user: shellUserSchema.nullable(),
  subPath: z.string().nullable(),
  theme: shellThemeSchema,
});

/** Sent by the shell when a JWT has been refreshed. */
export const jwtRefreshMessageSchema = z.object({
  type: z.literal('jwt-refresh'),
  protocolVersion,
  jwt: z.string(),
});

/** Sent by the shell when the user's session has ended. */
export const sessionEndedMessageSchema = z.object({
  type: z.literal('session-ended'),
  protocolVersion,
});

/** Sent by the shell to tell the child app to navigate to a specific path (browser back/forward). */
export const navigateToPathMessageSchema = z.object({
  type: z.literal('navigate-to-path'),
  protocolVersion,
  path: z.string(),
});

/** Sent by the shell when the theme changes (user toggle or system preference change). */
export const themeUpdateMessageSchema = z.object({
  type: z.literal('theme-update'),
  protocolVersion,
  theme: shellThemeSchema,
});

/** Sent by a child app to navigate back to the shell's root. */
export const navigateToShellMessageSchema = z.object({
  type: z.literal('navigate-to-shell'),
  protocolVersion,
});

/** Sent by a child app to request a fresh JWT from the shell. */
export const jwtRefreshRequestMessageSchema = z.object({
  type: z.literal('request-jwt-refresh'),
  protocolVersion,
});

/** Sent by a child app to request the shell context on mount. */
export const requestShellContextMessageSchema = z.object({
  type: z.literal('request-shell-context'),
  protocolVersion,
});

/** Sent by a child app when its internal route changes. */
export const routeChangeMessageSchema = z.object({
  type: z.literal('route-change'),
  protocolVersion,
  path: z.string(),
});

/** Sent by a child app to request a theme change. The shell is the source of truth. */
export const themeChangeMessageSchema = z.object({
  type: z.literal('theme-change'),
  protocolVersion,
  theme: shellThemeSchema,
});

/** Discriminated union of every message the shell sends to a child app. */
export const shellToChildMessageSchema = z.discriminatedUnion('type', [
  shellContextMessageSchema,
  jwtRefreshMessageSchema,
  sessionEndedMessageSchema,
  navigateToPathMessageSchema,
  themeUpdateMessageSchema,
]);

/** Discriminated union of every message a child app sends to the shell. */
export const childToShellMessageSchema = z.discriminatedUnion('type', [
  navigateToShellMessageSchema,
  jwtRefreshRequestMessageSchema,
  requestShellContextMessageSchema,
  routeChangeMessageSchema,
  themeChangeMessageSchema,
]);

/** A user identity provided by the shell. */
export type ShellUser = z.infer<typeof shellUserSchema>;

/** The active colour theme. */
export type ShellTheme = z.infer<typeof shellThemeSchema>;

/** Sent by the shell to provide the embedding context to a child app. */
export type ShellContextMessage = z.infer<typeof shellContextMessageSchema>;

/** Sent by the shell when a JWT has been refreshed. */
export type JWTRefreshMessage = z.infer<typeof jwtRefreshMessageSchema>;

/** Sent by the shell when the user's session has ended. */
export type SessionEndedMessage = z.infer<typeof sessionEndedMessageSchema>;

/** Sent by the shell to tell the child app to navigate to a specific path. */
export type NavigateToPathMessage = z.infer<typeof navigateToPathMessageSchema>;

/** Sent by the shell when the theme changes. */
export type ThemeUpdateMessage = z.infer<typeof themeUpdateMessageSchema>;

/** Sent by a child app to navigate back to the shell's root. */
export type NavigateToShellMessage = z.infer<typeof navigateToShellMessageSchema>;

/** Sent by a child app to request a fresh JWT from the shell. */
export type JWTRefreshRequestMessage = z.infer<typeof jwtRefreshRequestMessageSchema>;

/** Sent by a child app to request the shell context on mount. */
export type RequestShellContextMessage = z.infer<typeof requestShellContextMessageSchema>;

/** Sent by a child app when its internal route changes. */
export type RouteChangeMessage = z.infer<typeof routeChangeMessageSchema>;

/** Sent by a child app to request a theme change. */
export type ThemeChangeMessage = z.infer<typeof themeChangeMessageSchema>;

/** Union of all messages the shell sends to child apps. */
export type ShellToChildMessage = z.infer<typeof shellToChildMessageSchema>;

/** Union of all messages child apps send to the shell. */
export type ChildToShellMessage = z.infer<typeof childToShellMessageSchema>;

const SHELL_TO_CHILD_TYPES: ReadonlySet<string> = new Set([
  'shell-context',
  'jwt-refresh',
  'session-ended',
  'navigate-to-path',
  'theme-update',
]);

const CHILD_TO_SHELL_TYPES: ReadonlySet<string> = new Set([
  'navigate-to-shell',
  'request-jwt-refresh',
  'request-shell-context',
  'route-change',
  'theme-change',
]);

/**
 * Returns true when `data` looks like it was meant for the given direction's
 * protocol — specifically, it carries a matching `type` literal. Used to gate
 * "malformed message" warnings so we do not spam the console every time the
 * host page receives an unrelated postMessage (e.g. devtools, browser
 * extensions, the iframe's own third-party scripts).
 */
function hasKnownMessageType(data: unknown, knownTypes: ReadonlySet<string>): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const typeField = (data as Record<string, unknown>).type;
  return typeof typeField === 'string' && knownTypes.has(typeField);
}

/**
 * Returns true when a zod issue list contains a failure specifically on the
 * `protocolVersion` field. Used to surface a clearer warning than the generic
 * schema-validation message when a peer is on a different protocol build.
 */
function isProtocolVersionIssue(issues: readonly z.ZodIssue[]): boolean {
  return issues.some((issue) => issue.path[0] === 'protocolVersion');
}

/**
 * Extracts the `protocolVersion` value from a raw message payload for logging,
 * or `null` if it is not a number (e.g. missing or non-numeric).
 */
function readRawProtocolVersion(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const value = (data as Record<string, unknown>).protocolVersion;
  return typeof value === 'number' ? value : null;
}

/**
 * Parses an incoming shell → child message. Returns the typed message on
 * success, `null` when validation fails. Warns on the console when a
 * recognised-type message fails validation so developers see the problem, but
 * stays silent for the usual flood of unrelated postMessage traffic.
 *
 * @param data - The raw `event.data` payload from a `message` event.
 * @returns The validated message, or `null` if the payload is not a valid
 *   shell → child message.
 */
export function parseShellMessage(data: unknown): ShellToChildMessage | null {
  const result = shellToChildMessageSchema.safeParse(data);
  if (result.success) return result.data;

  if (hasKnownMessageType(data, SHELL_TO_CHILD_TYPES)) {
    if (isProtocolVersionIssue(result.error.issues)) {
      const received = readRawProtocolVersion(data);
      console.warn(
        `[shell-kit] protocol mismatch — received shell message v${received ?? 'unknown'}, expected v${PROTOCOL_VERSION}. Shell and child are running different shell-kit builds.`,
      );
    } else {
      console.warn('[shell-kit] dropped malformed shell→child message', result.error.issues);
    }
  }
  return null;
}

/**
 * Parses an incoming child → shell message. Returns the typed message on
 * success, `null` when validation fails. Warns on the console when a
 * recognised-type message fails validation so developers see the problem, but
 * stays silent for the usual flood of unrelated postMessage traffic.
 *
 * @param data - The raw `event.data` payload from a `message` event.
 * @returns The validated message, or `null` if the payload is not a valid
 *   child → shell message.
 */
export function parseChildMessage(data: unknown): ChildToShellMessage | null {
  const result = childToShellMessageSchema.safeParse(data);
  if (result.success) return result.data;

  if (hasKnownMessageType(data, CHILD_TO_SHELL_TYPES)) {
    if (isProtocolVersionIssue(result.error.issues)) {
      const received = readRawProtocolVersion(data);
      console.warn(
        `[shell-kit] protocol mismatch — received child message v${received ?? 'unknown'}, expected v${PROTOCOL_VERSION}. Shell and child are running different shell-kit builds.`,
      );
    } else {
      console.warn('[shell-kit] dropped malformed child→shell message', result.error.issues);
    }
  }
  return null;
}
