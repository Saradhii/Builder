"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { fetchTemplates, type Template } from "@/lib/templates";
import { ChatInterface } from "../components/chat";

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

/**
 * Renders a live, scaled-down "screenshot" of a template's HTML inside an
 * aspect-video box, matching the thumbnail style used on the /builds page.
 */
function TemplateThumb({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-muted/40 relative flex items-center justify-center border-b border-input overflow-hidden"
    >
      {scale > 0 ? (
        <iframe
          title={`${alt} thumbnail`}
          src={src}
          aria-hidden="true"
          tabIndex={-1}
          scrolling="no"
          className="border-0 pointer-events-none"
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          sandbox="allow-scripts"
          loading="lazy"
        />
      ) : (
        <Globe className="size-8 text-muted-foreground/40" />
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Link
      href={`/templates?template=${encodeURIComponent(template.id)}`}
      className="group block rounded-2xl border border-input bg-background/90 overflow-hidden transition-colors hover:border-primary/30"
    >
      <TemplateThumb src={template.htmlUrl} alt={template.name} />
      <div className="p-3">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{template.category}</p>
      </div>
    </Link>
  );
}

function TemplatesGallery() {
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
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-built starting points. Open one to load it into the builder —
            edit with prompts or by hand, then deploy your own copy.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {templates === null && !error && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {templates && templates.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-input/70 bg-background/45 px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground/90">
              No templates yet
            </p>
          </div>
        )}

        {templates && templates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplatesView() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  // Opening a template renders the exact builder view you get when a normal
  // generation finishes: chat + prompt on the left, preview/code on the right.
  if (templateId) {
    return <ChatInterface />;
  }
  return <TemplatesGallery />;
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TemplatesView />
    </Suspense>
  );
}
