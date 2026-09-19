import type { ProviderKind } from "@/lib/intelligence/types";
import type { IntelConfig } from "@/lib/intelligence/config";

export interface ProviderCall {
  system: string;
  user: string;
  maxTokens: number;
}

export interface LLMProvider {
  readonly kind: ProviderKind;
  call(call: ProviderCall): Promise<string>;
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(`[provider] unavailable: ${message}`);
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderTimeoutError extends Error {
  constructor() {
    super("[provider] request timed out");
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(`[provider] HTTP ${status}: ${message}`);
    this.name = "ProviderHttpError";
  }
}

/**
 * Minimal OpenAI-compatible chat completions client. Uses the module-global
 * `fetch` (server-side only, so it is unaffected by the client CSP) and an
 * AbortController signal to enforce the configured timeout. No SDK is
 * required — the engine stays dependency-free beyond the Node runtime.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly kind = "openai-compatible" as const;

  constructor(private config: Pick<IntelConfig, "aiBaseUrl" | "aiApiKey" | "aiModel" | "aiTimeoutMs">) {}

  async call(request: ProviderCall): Promise<string> {
    if (!this.config.aiApiKey) throw new ProviderUnavailableError("missing API key");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.aiTimeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.config.aiBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.aiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.aiModel,
          temperature: 0.2,
          max_tokens: request.maxTokens,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (timer) clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new ProviderTimeoutError();
      }
      throw new ProviderUnavailableError(err instanceof Error ? err.message : String(err));
    }
    clearTimeout(timer);

    if (!response.ok) {
      throw new ProviderHttpError(response.status, `provider returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new ProviderHttpError(response.status, "empty completion");
    }
    return content;
  }
}

export function createProvider(config: IntelConfig): LLMProvider {
  if (config.providerKind === "openai-compatible") {
    return new OpenAICompatibleProvider(config);
  }
  return {
    kind: "none" as const,
    async call() {
      throw new ProviderUnavailableError("no provider configured");
    },
  };
}