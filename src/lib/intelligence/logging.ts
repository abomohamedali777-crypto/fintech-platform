export type LogFn = (
  level: "info" | "warn" | "error",
  event: string,
  meta?: Record<string, unknown>,
) => void;

export const intelLog: LogFn = (level, event, meta = {}) => {
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  const metaJson = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  fn(`[intelligence] ${event}${metaJson}`);
};