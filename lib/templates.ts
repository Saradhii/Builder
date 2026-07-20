export type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  htmlUrl: string;
};

/**
 * Templates are generated snapshots (HTML) produced from their `prompt`.
 * Metadata + prompt text live in /public/templates/templates.json so they can
 * be updated without a rebuild. The HTML snapshot for each template is served
 * from /public/templates/<id>.html.
 */
export async function fetchTemplates(signal?: AbortSignal): Promise<Template[]> {
  const res = await fetch("/templates/templates.json", {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load templates (${res.status}).`);
  }
  const data = (await res.json()) as Template[];
  if (!Array.isArray(data)) {
    throw new Error("Invalid templates response.");
  }
  return data;
}

export async function fetchTemplateHtml(
  htmlUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(htmlUrl, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load template HTML (${res.status}).`);
  }
  return res.text();
}
