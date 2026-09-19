import { describe, it, expect } from "vitest";
import { readStreamBodyCapped } from "./readBody";

function encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** A stream whose pull() is counted, so tests can assert reads stop at the cap. */
function sourceStream(chunks: Uint8Array[], reads: { count: number } = { count: 0 }) {
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      reads.count += 1;
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[i]);
      i += 1;
    },
    cancel() {},
  });
}

describe("readStreamBodyCapped", () => {
  it("returns an empty body for a null stream", async () => {
    const out = await readStreamBodyCapped(null, 1024);
    expect(out).toEqual({ rawBody: "", oversized: false });
  });

  it("returns an empty body for an empty stream", async () => {
    const out = await readStreamBodyCapped(sourceStream([]), 1024);
    expect(out).toEqual({ rawBody: "", oversized: false });
  });

  it("decodes a small body under the cap", async () => {
    const out = await readStreamBodyCapped(sourceStream([encode("{\"a\":1}")]), 1024);
    expect(out).toEqual({ rawBody: '{"a":1}', oversized: false });
  });

  it("concatenates multi-chunk bodies", async () => {
    const out = await readStreamBodyCapped(sourceStream([encode("{\"a"), encode("b\":1}")]), 1024);
    expect(out.rawBody).toBe('{"ab":1}');
    expect(out.oversized).toBe(false);
  });

  it("flags oversized bodies and does not buffer past the cap", async () => {
    const reads = { count: 0 };
    const body = new Uint8Array(64).fill(0x78);
    const out = await readStreamBodyCapped(sourceStream([body, body, body], reads), 128);
    expect(out.oversized).toBe(true);
    expect(out.rawBody).toBe("");
    expect(reads.count).toBeLessThanOrEqual(3);
  });

  it("accepts a body exactly at the cap (no off-by-one)", async () => {
    const out = await readStreamBodyCapped(sourceStream([encode("a".repeat(1024))]), 1024);
    expect(out.oversized).toBe(false);
    expect(out.rawBody).toHaveLength(1024);
  });

  it("rejects a body one byte over the cap", async () => {
    const out = await readStreamBodyCapped(sourceStream([encode("a".repeat(1025))]), 1024);
    expect(out.oversized).toBe(true);
  });
});