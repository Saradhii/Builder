import type { MetadataRoute } from "next";

/**
 * Single source of truth for the site URL used across SEO metadata.
 * Override in production via NEXT_PUBLIC_SITE_URL (e.g. https://bldr.app).
 */
export const siteConfig = {
  name: "BLDR",
  shortName: "BLDR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://website-builder.vercel.app",
  title: "BLDR — AI Website Builder",
  tagline: "Describe it. Refine it. Ship it.",
  description:
    "BLDR is an AI-first website builder. Describe the site you want, refine it with follow-up prompts, preview it live, edit the HTML, and export — no code required.",
  keywords: [
    "AI website builder",
    "no-code website builder",
    "build a website with AI",
    "AI web design",
    "generate website from prompt",
    "HTML website generator",
    "landing page builder",
    "BLDR",
  ],
  authors: [{ name: "BLDR" }],
  locale: "en_US",
  themeColor: "#0423DA",
  ogImage: "/og-image.png",
} as const;
