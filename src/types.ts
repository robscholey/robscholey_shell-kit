// Message schemas and their inferred types live in messages.ts so zod owns the
// wire format end-to-end. types.ts re-exports the resulting types so external
// imports from '@robscholey/shell-kit' keep resolving unchanged.
export type {
  ShellUser,
  ShellTheme,
  Accent,
  ShellContextMessage,
  JWTRefreshMessage,
  SessionEndedMessage,
  NavigateToPathMessage,
  ThemeUpdateMessage,
  AccentUpdateMessage,
  NavigateToShellMessage,
  JWTRefreshRequestMessage,
  RequestShellContextMessage,
  RouteChangeMessage,
  ThemeChangeMessage,
  AccentChangeMessage,
  ShellToChildMessage,
  ChildToShellMessage,
} from './messages';
