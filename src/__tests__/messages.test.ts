import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  PROTOCOL_VERSION,
  parseShellMessage,
  parseChildMessage,
  shellToChildMessageSchema,
  childToShellMessageSchema,
} from '@/messages';

/**
 * Canonical, valid payloads for every message in the protocol. Used both to
 * assert that the schemas accept well-formed messages and as seed data for
 * the "reject when we strip a required field" cases below.
 */
const shellToChildValid = {
  'shell-context': {
    type: 'shell-context' as const,
    protocolVersion: PROTOCOL_VERSION,
    isEmbedded: true as const,
    showBackButton: false,
    shellOrigin: 'https://robscholey.com',
    jwt: null,
    user: null,
    subPath: null,
    theme: 'light' as const,
  },
  'jwt-refresh': {
    type: 'jwt-refresh' as const,
    protocolVersion: PROTOCOL_VERSION,
    jwt: 'abc',
  },
  'session-ended': {
    type: 'session-ended' as const,
    protocolVersion: PROTOCOL_VERSION,
  },
  'navigate-to-path': {
    type: 'navigate-to-path' as const,
    protocolVersion: PROTOCOL_VERSION,
    path: '/projects/1',
  },
  'theme-update': {
    type: 'theme-update' as const,
    protocolVersion: PROTOCOL_VERSION,
    theme: 'dark' as const,
  },
};

const childToShellValid = {
  'navigate-to-shell': {
    type: 'navigate-to-shell' as const,
    protocolVersion: PROTOCOL_VERSION,
  },
  'request-jwt-refresh': {
    type: 'request-jwt-refresh' as const,
    protocolVersion: PROTOCOL_VERSION,
  },
  'request-shell-context': {
    type: 'request-shell-context' as const,
    protocolVersion: PROTOCOL_VERSION,
  },
  'route-change': {
    type: 'route-change' as const,
    protocolVersion: PROTOCOL_VERSION,
    path: '/projects/1',
  },
  'theme-change': {
    type: 'theme-change' as const,
    protocolVersion: PROTOCOL_VERSION,
    theme: 'dark' as const,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PROTOCOL_VERSION', () => {
  it('is pinned to 1 for the initial wire format', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });
});

describe('shellToChildMessageSchema', () => {
  it.each(Object.entries(shellToChildValid))(
    'accepts a canonical %s message',
    (_type, payload) => {
      expect(shellToChildMessageSchema.safeParse(payload).success).toBe(true);
    },
  );

  it.each(Object.entries(shellToChildValid))(
    'rejects a %s message with the wrong protocolVersion',
    (_type, payload) => {
      const result = shellToChildMessageSchema.safeParse({ ...payload, protocolVersion: 2 });
      expect(result.success).toBe(false);
    },
  );

  it('rejects shell-context when isEmbedded is false', () => {
    const result = shellToChildMessageSchema.safeParse({
      ...shellToChildValid['shell-context'],
      isEmbedded: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects theme-update with an invalid theme value', () => {
    const result = shellToChildMessageSchema.safeParse({
      ...shellToChildValid['theme-update'],
      theme: 'neon',
    });
    expect(result.success).toBe(false);
  });

  it('rejects messages with an unknown type', () => {
    const result = shellToChildMessageSchema.safeParse({
      type: 'definitely-not-a-real-message',
      protocolVersion: PROTOCOL_VERSION,
    });
    expect(result.success).toBe(false);
  });
});

describe('childToShellMessageSchema', () => {
  it.each(Object.entries(childToShellValid))(
    'accepts a canonical %s message',
    (_type, payload) => {
      expect(childToShellMessageSchema.safeParse(payload).success).toBe(true);
    },
  );

  it.each(Object.entries(childToShellValid))(
    'rejects a %s message with the wrong protocolVersion',
    (_type, payload) => {
      const result = childToShellMessageSchema.safeParse({ ...payload, protocolVersion: 2 });
      expect(result.success).toBe(false);
    },
  );

  it('rejects route-change without a path', () => {
    const result = childToShellMessageSchema.safeParse({
      type: 'route-change',
      protocolVersion: PROTOCOL_VERSION,
    });
    expect(result.success).toBe(false);
  });

  it('rejects theme-change with an invalid theme value', () => {
    const result = childToShellMessageSchema.safeParse({
      ...childToShellValid['theme-change'],
      theme: 'neon',
    });
    expect(result.success).toBe(false);
  });
});

describe('parseShellMessage', () => {
  it('returns the parsed message for a valid payload', () => {
    const result = parseShellMessage(shellToChildValid['shell-context']);
    expect(result).toEqual(shellToChildValid['shell-context']);
  });

  it('returns null and warns when a known-type payload has the wrong protocolVersion', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseShellMessage({
      ...shellToChildValid['shell-context'],
      protocolVersion: 2,
    });

    expect(result).toBeNull();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0] ?? '')).toContain('protocol mismatch');
  });

  it('returns null and warns when a known-type payload is structurally invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseShellMessage({
      type: 'shell-context',
      protocolVersion: PROTOCOL_VERSION,
      // Missing the rest of the shell-context fields.
    });

    expect(result).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null silently for unrelated payloads', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseShellMessage(null)).toBeNull();
    expect(parseShellMessage('plain string')).toBeNull();
    expect(parseShellMessage({ type: 'something-else', foo: 'bar' })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on child → shell messages arriving on a shell → child listener', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseShellMessage(childToShellValid['route-change']);

    expect(result).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('parseChildMessage', () => {
  it('returns the parsed message for a valid payload', () => {
    const result = parseChildMessage(childToShellValid['route-change']);
    expect(result).toEqual(childToShellValid['route-change']);
  });

  it('returns null and warns on a known-type protocol mismatch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseChildMessage({
      ...childToShellValid['route-change'],
      protocolVersion: 99,
    });

    expect(result).toBeNull();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0] ?? '')).toContain('protocol mismatch');
  });

  it('returns null silently for unrelated payloads', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseChildMessage({ type: 'irrelevant' })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});
