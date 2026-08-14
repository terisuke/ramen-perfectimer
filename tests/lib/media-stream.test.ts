import { describe, expect, it, vi } from 'vitest';
import { stopMediaTracks } from '@/lib/media-stream';

describe('stopMediaTracks', () => {
  it('stops every track in the stream exactly once', () => {
    const stopFirst = vi.fn();
    const stopSecond = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopFirst }, { stop: stopSecond }],
    } as unknown as MediaStream;

    stopMediaTracks(stream);

    expect(stopFirst).toHaveBeenCalledOnce();
    expect(stopSecond).toHaveBeenCalledOnce();
  });

  it('accepts a missing stream without throwing', () => {
    expect(() => stopMediaTracks(null)).not.toThrow();
  });
});
