type DeployWebsiteRequest = {
  id: string;
  html: string;
  name?: string;
  thumbnail?: string;
};

type DeployWebsiteResponse = {
  id: string;
  url: string;
};

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8788";

const DEPLOY_ENDPOINTS = ["/api/websites/deploy", "/api/deploy"];

function buildUrl(path: string) {
  const base = DEFAULT_BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDeployResponse(payload: unknown): DeployWebsiteResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid deploy response.");
  }

  const idValue =
    typeof payload.id === "string"
      ? payload.id
      : typeof payload.websiteId === "string"
        ? payload.websiteId
        : "";

  const urlValue =
    typeof payload.url === "string"
      ? payload.url
      : typeof payload.shareUrl === "string"
        ? payload.shareUrl
        : typeof payload.previewUrl === "string"
          ? payload.previewUrl
          : "";

  if (!idValue || !urlValue) {
    throw new Error("Deploy response is missing id or url.");
  }

  return { id: idValue, url: urlValue };
}

async function readErrorMessage(res: Response) {
  try {
    const data = (await res.json()) as { error?: string; message?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore parse errors and fall back to HTTP status.
  }

  return `${res.status} ${res.statusText}`.trim();
}

export async function deployWebsite(
  request: DeployWebsiteRequest,
  signal?: AbortSignal
) {
  let lastError: Error | null = null;

  for (let index = 0; index < DEPLOY_ENDPOINTS.length; index += 1) {
    const endpoint = DEPLOY_ENDPOINTS[index];
    const isLastEndpoint = index === DEPLOY_ENDPOINTS.length - 1;

    try {
      const res = await fetch(buildUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });

      if (res.status === 404 && !isLastEndpoint) {
        continue;
      }

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "Deploy API is not available yet. Add /api/websites/deploy on your backend."
          );
        }
        throw new Error(await readErrorMessage(res));
      }

      const payload = (await res.json()) as unknown;
      return parseDeployResponse(payload);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Failed to deploy website.");
      if (isLastEndpoint) {
        break;
      }
    }
  }

  throw lastError ?? new Error("Failed to deploy website.");
}

export type { DeployWebsiteRequest, DeployWebsiteResponse };
