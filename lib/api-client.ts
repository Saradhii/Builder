export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
};

export type ModelsResponse = {
  models: ModelInfo[];
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type ChatRequest = {
  model: string;
  input?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  [key: string]: unknown;
};

export type StreamCallbacks = {
  onToken: (token: string) => void;
  onReasoningToken?: (token: string) => void;
  onEvent?: (payload: unknown) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
};

type ApiErrorDetails = {
  status: number;
  code?: string;
  provider?: string;
  attemptedProviders?: string[];
};

type ApiErrorResponse = ApiErrorDetails & {
  message: string;
};

const PRIMARY_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8788";

const FALLBACK_BASE_URLS = (process.env.NEXT_PUBLIC_API_FALLBACK_BASE_URLS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export class ApiError extends Error {
  status: number;
  code?: string;
  provider?: string;
  attemptedProviders?: string[];

  constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = details.status;
    this.code = details.code;
    this.provider = details.provider;
    this.attemptedProviders = details.attemptedProviders;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(path: string, baseUrl: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!baseUrl) return normalizedPath;
  return `${baseUrl}${normalizedPath}`;
}

function getBaseCandidates() {
  const candidates = [PRIMARY_BASE_URL, ...FALLBACK_BASE_URLS]
    .map((baseUrl) => normalizeBaseUrl(baseUrl))
    .filter(Boolean);

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

function shouldTryNextBase(status: number) {
  if (status === 408 || status === 409 || status === 425 || status === 429) {
    return true;
  }
  return status >= 500 && status <= 599;
}

async function readErrorResponse(res: Response): Promise<ApiErrorResponse> {
  try {
    const payload = (await res.json()) as {
      error?: string;
      message?: string;
      status?: number;
      code?: string;
      provider?: string;
      attemptedProviders?: string[];
    };

    const message =
      (typeof payload.error === "string" && payload.error) ||
      (typeof payload.message === "string" && payload.message) ||
      `${res.status} ${res.statusText}`.trim();

    return {
      message,
      status: typeof payload.status === "number" ? payload.status : res.status,
      code: typeof payload.code === "string" ? payload.code : undefined,
      provider: typeof payload.provider === "string" ? payload.provider : undefined,
      attemptedProviders: Array.isArray(payload.attemptedProviders)
        ? payload.attemptedProviders.filter(
            (provider): provider is string => typeof provider === "string"
          )
        : undefined,
    };
  } catch {
    // Ignore JSON parse errors and fall back to status text.
  }

  const fallbackMessage = `${res.status} ${res.statusText}`.trim();
  return {
    message: fallbackMessage,
    status: res.status,
  };
}

function ensureApiError(error: unknown, fallbackStatus = 500): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message, { status: fallbackStatus });
  }
  return new ApiError("Something went wrong while contacting the API.", {
    status: fallbackStatus,
  });
}

async function requestWithBaseFallback(path: string, init: RequestInit) {
  const baseCandidates = getBaseCandidates();
  let lastError: ApiError | null = null;

  for (const [index, base] of baseCandidates.entries()) {
    const isLast = index === baseCandidates.length - 1;
    const url = buildUrl(path, base);

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      lastError = new ApiError("Unable to reach the API service.", {
        status: 503,
        code: "NETWORK_ERROR",
      });

      if (!isLast) continue;
      throw lastError;
    }

    if (res.ok) {
      return res;
    }

    const details = await readErrorResponse(res);
    lastError = new ApiError(details.message, details);

    if (!isLast && shouldTryNextBase(details.status)) {
      continue;
    }

    throw lastError;
  }

  throw (
    lastError ??
    new ApiError("Unable to reach the API service.", {
      status: 503,
      code: "NETWORK_ERROR",
    })
  );
}

export type SiteInfo = {
  id: string;
  name: string | null;
  updatedAt: string;
  url: string;
  thumbnailUrl: string;
};

export async function fetchSites(signal?: AbortSignal) {
  const res = await requestWithBaseFallback("/api/websites", { signal });
  const data = (await res.json()) as { sites: SiteInfo[] };
  return data.sites;
}

export async function fetchModels(signal?: AbortSignal) {
  const res = await requestWithBaseFallback("/api/ai/models", { signal });

  const data = (await res.json()) as ModelsResponse;
  if (!data || !Array.isArray(data.models)) {
    throw new Error("Invalid models response.");
  }
  return data.models;
}

type SseParseResult = {
  events: string[];
  rest: string;
};

function extractSseEvents(buffer: string): SseParseResult {
  const events: string[] = [];
  let remaining = buffer.replace(/\r\n/g, "\n");

  while (true) {
    const boundaryIndex = remaining.indexOf("\n\n");
    if (boundaryIndex === -1) break;

    const rawEvent = remaining.slice(0, boundaryIndex).trim();
    remaining = remaining.slice(boundaryIndex + 2);

    if (!rawEvent) continue;

    const dataLines = rawEvent
      .split("\n")
      .filter((line) => line.startsWith("data:"));

    if (dataLines.length === 0) continue;

    const data = dataLines
      .map((line) => line.replace(/^data:\s?/, ""))
      .join("\n");

    events.push(data);
  }

  return { events, rest: remaining };
}

function extractToken(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  type ChoicePayload = {
    delta?: { content?: unknown; text?: unknown };
    message?: { content?: unknown };
    text?: unknown;
  };

  const choice = (payload as { choices?: ChoicePayload[] }).choices?.[0];
  if (!choice) return null;

  if (typeof choice.delta?.content === "string") return choice.delta.content;
  if (typeof choice.delta?.text === "string") return choice.delta.text;
  if (typeof choice.message?.content === "string") return choice.message.content;
  if (typeof choice.text === "string") return choice.text;

  return null;
}

function extractReasoningToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  type ChoicePayload = {
    delta?: { reasoning_content?: unknown };
    message?: { reasoning_content?: unknown };
  };

  const choice = (payload as { choices?: ChoicePayload[] }).choices?.[0];
  if (!choice) return null;

  if (typeof choice.delta?.reasoning_content === "string") return choice.delta.reasoning_content;
  if (typeof choice.message?.reasoning_content === "string") return choice.message.reasoning_content;

  return null;
}

export async function streamChat(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  let res: Response;
  try {
    res = await requestWithBaseFallback("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    const apiError = ensureApiError(error, 500);
    callbacks.onError?.(apiError.message);
    throw apiError;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const message = "Response body is empty.";
    callbacks.onError?.(message);
    throw new Error(message);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = extractSseEvents(buffer);
    buffer = rest;

    for (const data of events) {
      if (!data) continue;

      if (data === "[DONE]") {
        callbacks.onDone?.();
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        callbacks.onToken(data);
        continue;
      }

      const token = extractToken(parsed);
      if (token) callbacks.onToken(token);

      const reasoningToken = extractReasoningToken(parsed);
      if (reasoningToken) callbacks.onReasoningToken?.(reasoningToken);

      callbacks.onEvent?.(parsed);
    }
  }

  callbacks.onDone?.();
}
