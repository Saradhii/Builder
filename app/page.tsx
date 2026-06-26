import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatInterface } from "./components/chat";

export const metadata: Metadata = {
  title: "BLDR — AI Website Builder | Build a site from a prompt",
  description:
    "Build a website with AI. Describe what you want in plain English, refine it with follow-up prompts, preview it live, and export clean HTML — all in one place.",
  alternates: { canonical: "/" },
};

export default function Home() {
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
