import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatInterface } from "../components/chat";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Start from a pre-built template and make it yours — edit with prompts or by hand, then deploy your own copy.",
  alternates: { canonical: "/templates/" },
};

export default function TemplatesPage() {
  return (
    <div className="h-full w-full flex items-center justify-center px-2 py-3 sm:px-4 sm:py-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <div className="relative h-full w-full">
          <ChatInterface />
        </div>
      </Suspense>
    </div>
  );
}
