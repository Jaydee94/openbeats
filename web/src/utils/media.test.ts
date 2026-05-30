import { describe, it, expect } from 'vitest';
import { isVideo } from './media';

describe('isVideo', () => {
  it('returns true for video/mp4', () => {
    expect(isVideo('video/mp4')).toBe(true);
  });
  it('returns true for video/webm', () => {
    expect(isVideo('video/webm')).toBe(true);
  });
  it('returns false for audio/mpeg', () => {
    expect(isVideo('audio/mpeg')).toBe(false);
  });
  it('returns false for audio/mp4', () => {
    expect(isVideo('audio/mp4')).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isVideo('')).toBe(false);
  });
});
