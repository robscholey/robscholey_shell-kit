import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configure, getConfig, _testResetConfig } from '@/config';

beforeEach(() => {
  _testResetConfig();
});

function withPageOrigin(origin: string, fn: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'location');
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, origin },
  });
  try {
    fn();
  } finally {
    if (descriptor) Object.defineProperty(window, 'location', descriptor);
  }
}

describe('config', () => {
  it('returns default config', () => {
    expect(getConfig().shellOrigin).toBe('https://robscholey.com');
  });

  it('overrides shellOrigin via configure()', () => {
    configure({ shellOrigin: 'http://localhost:3000' });
    expect(getConfig().shellOrigin).toBe('http://localhost:3000');
  });

  it('resets to defaults via _testResetConfig()', () => {
    configure({ shellOrigin: 'http://localhost:3000' });
    _testResetConfig();
    expect(getConfig().shellOrigin).toBe('https://robscholey.com');
  });

  it('merges partial config without overwriting other fields', () => {
    const before = getConfig();
    configure({});
    expect(getConfig()).toEqual(before);
  });

  describe('mismatched-origin alert', () => {
    let alertSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      alertSpy.mockRestore();
    });

    it('alerts when shellOrigin is localhost but page is not', () => {
      withPageOrigin('https://admin.robscholey.com', () => {
        configure({ shellOrigin: 'http://localhost:3000' });
      });
      expect(alertSpy).toHaveBeenCalledOnce();
      expect(alertSpy.mock.calls[0][0]).toMatch(/http:\/\/localhost:3000/);
      expect(alertSpy.mock.calls[0][0]).toMatch(/https:\/\/admin\.robscholey\.com/);
    });

    it('stays quiet when both the origin and shellOrigin are localhost', () => {
      withPageOrigin('http://localhost:3000', () => {
        configure({ shellOrigin: 'http://localhost:3000' });
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('stays quiet when both the origin and shellOrigin are production', () => {
      withPageOrigin('https://admin.robscholey.com', () => {
        configure({ shellOrigin: 'https://robscholey.com' });
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('alerts when shellOrigin is not a valid URL', () => {
      configure({ shellOrigin: 'not a url' });
      expect(alertSpy).toHaveBeenCalledOnce();
      expect(alertSpy.mock.calls[0][0]).toMatch(/not a valid URL/);
    });
  });
});
