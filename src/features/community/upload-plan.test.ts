import { describe, expect, test } from 'bun:test';

import { coverColumns, progressOf, videoFileType } from './upload-plan';

describe('coverColumns', () => {
  test('no media: text-only post', () => {
    expect(coverColumns([])).toEqual({ image_url: null, video_url: null, video_duration_ms: null });
  });
  test('first photo is the cover', () => {
    expect(
      coverColumns([
        { type: 'image', url: 'https://x/a.jpg', posterUrl: null, durationMs: null },
        { type: 'video', url: 'https://x/b.mp4', posterUrl: 'https://x/b.jpg', durationMs: 5000 },
      ]),
    ).toEqual({ image_url: 'https://x/a.jpg', video_url: null, video_duration_ms: null });
  });
  test('first video: poster as image, length rounded', () => {
    expect(coverColumns([{ type: 'video', url: 'https://x/b.mp4', posterUrl: 'https://x/b.jpg', durationMs: 4200.6 }])).toEqual({
      image_url: 'https://x/b.jpg',
      video_url: 'https://x/b.mp4',
      video_duration_ms: 4201,
    });
  });
});

describe('progressOf', () => {
  test('clamped share of bytes', () => {
    expect(progressOf(0, 10)).toBe(0);
    expect(progressOf(200, 50)).toBe(0.25);
    expect(progressOf(200, 250)).toBe(1);
  });
});

describe('videoFileType', () => {
  test('known and unknown types', () => {
    expect(videoFileType('video/quicktime')).toEqual({ contentType: 'video/quicktime', extension: 'mov' });
    expect(videoFileType('video/x-matroska')).toEqual({ contentType: 'video/mp4', extension: 'mp4' });
    expect(videoFileType(null)).toEqual({ contentType: 'video/mp4', extension: 'mp4' });
  });
});
