import Link from "next/link";
import { Orbit } from "@/components/animate-ui/icons/orbit";

export default function TemplatesPage() {
  return (
    <main className="min-h-[60vh] max-w-3xl mx-auto px-4 xl:px-0 py-16 sm:py-24">
      <div className="flex flex-col items-center justify-center text-center gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-input bg-background/90 text-primary">
          <Orbit size={32} />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Templates
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Browse ready-to-use starter templates to jumpstart your next build.
            Coming soon.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-input bg-background/90 px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Placeholder
        </span>
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
