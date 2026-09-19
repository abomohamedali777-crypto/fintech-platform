export type CappedBodyRead = { rawBody: string; oversized: boolean };

/**
 * Read a request body stream while hard-capping the number of bytes buffered.
 *
 * The route handler must NOT call `request.text()` first: that buffers an
 * arbitrarily large chunked body into memory before any size check can run.
 * This reads the stream chunk by chunk and stops the moment the cap is
 * exceeded, so an oversized body is rejected before it is fully buffered.
 * A body that decodes to a valid JSON object underneath the cap is returned
 * intact; one over the cap comes back as `oversized: true` (caller returns 413).
 */
export async function readStreamBodyCapped(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<CappedBodyRead> {
  if (!stream) return { rawBody: "", oversized: false };

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { rawBody: "", oversized: true };
      }
      chunks.push(value);
    }
  } catch {
    // A stream error mid-read is not "too large" — an empty body will surface
    // as invalid JSON downstream instead of a misleading 413.
    return { rawBody: "", oversized: false };
  } finally {
    reader.releaseLock();
  }

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { rawBody: new TextDecoder("utf-8").decode(buf), oversized: false };
}