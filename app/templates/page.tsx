"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Rocket } from "lucide-react";
import { fetchTemplates, type Template } from "@/lib/templates";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchTemplates(controller.signal)
      .then(setTemplates)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load templates.");
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen w-full">
      <div className="max-w-6xl mx-auto px-4 xl:px-0 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Templates
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Production-ready starting points generated from a prompt. Open one to
            load the full HTML into the builder — edit with follow-up prompts or
            by hand, then deploy your own copy.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        )}

        {templates === null && !error && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {templates && templates.length > 0 && (
          <div className="space-y-6">
            {templates.map((template) => (
              <TemplateRow key={template.id} template={template} />
            ))}
          </div>
        )}

        {templates && templates.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-input/70 px-4 py-16 text-center text-sm text-muted-foreground">
            No templates yet.
          </div>
        )}
      </div>
    </main>
  );
}

function TemplateRow({ template }: { template: Template }) {
  return (
    <section className="rounded-2xl border border-input bg-background/90 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-input px-5 py-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {template.name}
              </h2>
              <span className="inline-flex items-center rounded-full border border-input bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {template.description}
            </p>
          </div>
        </div>
        <Link
          href={`/?template=${encodeURIComponent(template.id)}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Rocket className="size-3.5" />
          Use template
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col border-b border-input lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Prompt
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {template.prompt.length.toLocaleString()} chars
            </span>
          </div>
          <pre className="m-4 mt-2 max-h-[460px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            {template.prompt}
          </pre>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Live preview
            </span>
            <Link
              href={template.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-primary hover:underline underline-offset-4"
            >
              Open ↗
            </Link>
          </div>
          <div className="m-4 mt-2 h-[460px] overflow-hidden rounded-lg border border-input bg-white">
            <iframe
              title={`${template.name} preview`}
              src={template.htmlUrl}
              className="h-full w-full"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
