export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

const store = new Map<string, { windowStart: number; count: number }>();

let operationsSincePrune = 0;

function maybePrune(windowMs: number) {
  operationsSincePrune += 1;
  if (operationsSincePrune < 500) return;
  operationsSincePrune = 0;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) store.delete(key);
  }
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = options.now ?? Date.now();
  maybePrune(options.windowMs);
  let entry = store.get(key);

  if (!entry || now - entry.windowStart >= options.windowMs) {
    store.set(key, { windowStart: now, count: 0 });
    entry = store.get(key)!;
  }

  entry.count += 1;

  if (entry.count > options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.windowStart + options.windowMs - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getWindowInfo(key: string) {
  return store.get(key) ?? null;
}