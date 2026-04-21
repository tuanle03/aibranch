import { describe, it, expect } from 'vitest';
import { KnownError } from '../../src/utils/error.js';

describe('KnownError', () => {
  it('is an instance of Error', () => {
    const err = new KnownError('something went wrong');
    expect(err).toBeInstanceOf(Error);
  });

  it('preserves the message', () => {
    const err = new KnownError('bad config value');
    expect(err.message).toBe('bad config value');
  });

  it('has name KnownError', () => {
    const err = new KnownError('x');
    expect(err.name).toBe('KnownError');
  });
});
