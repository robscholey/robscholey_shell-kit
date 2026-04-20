// Message schemas and their inferred types live in messages.ts so zod owns the
// wire format end-to-end. types.ts re-exports the resulting types so external
// imports from '@robscholey/shell-kit' keep resolving unchanged.
export type {
  ShellUser,
  ShellTheme,
  ShellContextMessage,
  JWTRefreshMessage,
  SessionEndedMessage,
  NavigateToPathMessage,
  ThemeUpdateMessage,
  NavigateToShellMessage,
  JWTRefreshRequestMessage,
  RequestShellContextMessage,
  RouteChangeMessage,
  ThemeChangeMessage,
  ShellToChildMessage,
  ChildToShellMessage,
} from './messages';
