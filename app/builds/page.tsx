"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchSites, type SiteInfo } from "@/lib/api-client";
import { ExternalLink, Globe, Loader2 } from "lucide-react";

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function SiteCard({ site }: { site: SiteInfo }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group rounded-2xl border border-input bg-background/90 overflow-hidden transition-colors hover:border-primary/30">
      <div className="aspect-video bg-muted/40 relative flex items-center justify-center border-b border-input">
        {site.thumbnailUrl && !imgError ? (
          <Image
            src={site.thumbnailUrl}
            alt={site.name ?? site.id}
            fill
            className="object-cover object-top"
            sizes="320px"
            onError={() => setImgError(true)}
          />
        ) : (
          <Globe className="size-8 text-muted-foreground/40" />
        )}
        <Link
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 size-7 rounded-full bg-background/90 border border-input flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">
          {site.name ?? site.id}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(site.updatedAt)}
        </p>
      </div>
    </div>
  );
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    fetchSites(controller.signal)
      .then((data) => {
        if (!active) return;
        setSites(data);
        setStatus("idle");
      })
      .catch((err) => {
        if (!active || controller.signal.aborted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load sites.");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Deployed Builds
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All websites you&apos;ve built and deployed.
          </p>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error ?? "Failed to load sites."}
          </div>
        )}

        {status !== "loading" && status !== "error" && sites.length === 0 && (
          <div className="rounded-xl border border-dashed border-input/70 bg-background/45 px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground/90">
              No deployed sites yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Build and deploy your first website to see it here.
            </p>
          </div>
        )}

        {sites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
