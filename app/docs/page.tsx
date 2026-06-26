import type { Metadata } from "next";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Bot } from "@/components/animate-ui/icons/bot";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { SquareKanban } from "@/components/animate-ui/icons/square-kanban";

export const metadata: Metadata = {
  title: "Docs — How to build a website with AI",
  description:
    "Learn how to use BLDR, an AI website builder. Pick a model, describe the website you want with clear prompts, iterate with follow-ups, and export clean HTML.",
  alternates: { canonical: "/docs/" },
  openGraph: {
    title: "Docs — How to build a website with AI · BLDR",
    description:
      "A step-by-step guide to building websites with BLDR's AI: model selection, prompting tips, iteration, and export.",
    url: "/docs/",
  },
};

export default function DocsPage() {
  return (
    <div className="relative h-full overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:240px_1px,1px_220px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:py-8 md:py-10">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-dashed border-input bg-background/90 p-4 shadow-sm backdrop-blur-sm sm:p-6 md:p-8">
          <article className="space-y-8 text-foreground pt-1">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                What This Project Is
              </h2>
              <p className="text-base leading-8 text-muted-foreground">
                Website Builder is an AI-first workspace where you describe the website
                you want, then refine it with follow-up prompts. You get a live preview,
                editable HTML output, model selection, and image upload support in one
                flow.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                How To Use It
              </h2>
              <div className="space-y-4">
                <AnimateIcon animateOnHover asChild>
                  <div className="rounded-2xl border border-input/80 bg-background/70 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Bot size={16} />
                      Step 1: Choose a Model
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                      Use the model selector in chat input. Pick any available model and
                      start with a clear prompt.
                    </p>
                  </div>
                </AnimateIcon>

                <AnimateIcon animateOnHover asChild>
                  <div className="rounded-2xl border border-input/80 bg-background/70 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles size={16} />
                      Step 2: Describe the Website
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                      Ask for layout, colors, sections, tone, and content. You can upload
                      images and paste references to guide style.
                    </p>
                  </div>
                </AnimateIcon>

                <AnimateIcon animateOnHover asChild>
                  <div className="rounded-2xl border border-input/80 bg-background/70 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <SquareKanban size={16} />
                      Step 3: Iterate and Export
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                      Keep refining with small edits like “tighten spacing” or “add pricing
                      section.” When done, download/export your HTML.
                    </p>
                  </div>
                </AnimateIcon>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Simple Prompt Tips</h2>
              <ul className="space-y-2 text-sm leading-7 text-muted-foreground sm:text-base">
                <li>
                  Start with one sentence: product type, audience, and goal.
                </li>
                <li>
                  Add constraints: mobile-first, dark/light, section count, tone.
                </li>
                <li>
                  Iterate in short steps instead of rewriting everything at once.
                </li>
                <li>
                  Use “keep everything else the same” when changing only one part.
                </li>
              </ul>
            </section>
          </article>
        </section>
      </div>
    </div>
  );
}
