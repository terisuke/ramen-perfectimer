import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/identify/route';

/**
 * These tests cover the upload-validation regression fixed in 1885040 /
 * fde717d: a request whose `image` field is absent or is not a File must be
 * rejected with a 400 NO_IMAGE envelope *before* any recognition engine is
 * contacted. Without the `instanceof File` guard the handler reaches
 * `imageFile.arrayBuffer()`, throws, and degrades into a 500.
 *
 * No test here may touch a real engine. `fetch` is stubbed and
 * GEMINI_API_KEY is cleared, so both engines fail closed and offline.
 */

let fetchSpy: ReturnType<typeof vi.fn>;
let originalGeminiKey: string | undefined;

beforeEach(() => {
  originalGeminiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  fetchSpy = vi.fn(async () => {
    throw new Error('network access is not allowed in tests');
  });
  vi.stubGlobal('fetch', fetchSpy);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function postForm(form: FormData): Promise<Response> {
  return POST(new NextRequest('http://localhost/api/identify', { method: 'POST', body: form }));
}

describe('POST /api/identify — invalid upload axis', () => {
  it('rejects an empty form body with 400 NO_IMAGE', async () => {
    const response = await postForm(new FormData());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'NO_IMAGE' });
  });

  it('rejects a form whose image field is missing', async () => {
    const form = new FormData();
    form.append('notTheImageField', 'anything');

    const response = await postForm(form);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'NO_IMAGE' });
  });

  it('rejects a form whose image field is a string rather than a File', async () => {
    const form = new FormData();
    form.append('image', 'not-a-file');

    const response = await postForm(form);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'NO_IMAGE' });
  });

  it('carries a user-facing message on the NO_IMAGE envelope', async () => {
    const response = await postForm(new FormData());
    const body = (await response.json()) as { error: string; message?: string };

    expect(body.error).toBe('NO_IMAGE');
    expect(typeof body.message).toBe('string');
    expect(body.message).not.toHaveLength(0);
  });

  it('short-circuits before contacting any recognition engine', async () => {
    const form = new FormData();
    form.append('image', 'not-a-file');

    const response = await postForm(form);

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not degrade an invalid upload into a 500', async () => {
    // The pre-fix behaviour: no guard -> imageFile.arrayBuffer() throws ->
    // catch -> RECOGNITION_FAILED/500. Pin the difference explicitly.
    const form = new FormData();
    form.append('image', 'not-a-file');

    const response = await postForm(form);
    const body = (await response.json()) as { error: string };

    expect(response.status).not.toBe(500);
    expect(body.error).not.toBe('RECOGNITION_FAILED');
  });
});

describe('POST /api/identify — malformed request axis', () => {
  it('answers a non-multipart body with the 500 RECOGNITION_FAILED envelope', async () => {
    const request = new NextRequest('http://localhost/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'nope' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: 'RECOGNITION_FAILED',
      suggestion: 'manual',
    });
  });
});

describe('POST /api/identify — no engine available axis', () => {
  it('returns 404 NOT_FOUND with a manual suggestion when every engine fails', async () => {
    const form = new FormData();
    form.append('image', new File([new Uint8Array([1, 2, 3])], 'ramen.jpg', { type: 'image/jpeg' }));

    const response = await postForm(form);
    const body = (await response.json()) as { error: string; suggestion: string };

    expect(response.status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
    expect(body.suggestion).toBe('manual');
    // A valid upload *must* reach the engine, unlike the invalid ones above.
    expect(fetchSpy).toHaveBeenCalled();
  });
});
