# BLDR — AI Website Builder

BLDR is an AI-first workspace for building websites from natural language. Describe the
site you want, refine it with follow-up prompts, preview it live, edit the generated HTML,
and export — all in a single flow.

## Features

- 🤖 **Prompt-to-website** — generate a full site from a single description.
- 🎨 **Live preview** — see changes instantly as you iterate.
- 💬 **Conversational refinement** — tweak layout, colors, sections, and tone with short prompts.
- 🧩 **Model selection** — pick any available model from the chat input.
- 🖼️ **Image upload** — reference images to guide style and content.
- 📤 **One-click export** — download clean, editable HTML.
- 🌗 **Dark / light theme** with system preference detection.
- 🚀 **Deployed builds** dashboard for your published sites.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, static export)
- React 19, TypeScript
- Tailwind CSS v4
- Radix UI + shadcn-style components
- Motion for animations

## Getting started

### Prerequisites

- Node.js 18+ (recommended 20+)
- A running backend API (see `NEXT_PUBLIC_API_BASE_URL`)

### Install & run

```bash
npm install
cp .env.example .env.local   # then edit values as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Primary backend endpoint. |
| `NEXT_PUBLIC_API_FALLBACK_BASE_URLS` | Optional comma-separated backup endpoints. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for SEO metadata (set this in production). |

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Static production build (output in `dist/`). |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

## How to use

1. **Choose a model** from the selector in the chat input.
2. **Describe the website** — product type, audience, goal, layout, colors, tone.
3. **Iterate** with small edits like “tighten spacing” or “add a pricing section.”
4. **Export** the HTML when you're happy with it.

See the in-app **Docs** page for prompting tips.

## Project structure

```
app/
  layout.tsx        # Root layout + global SEO metadata, JSON-LD
  page.tsx          # Home (chat workspace)
  docs/             # How-to / documentation
  builds/           # Deployed builds dashboard
  manifest.ts       # PWA web manifest
  sitemap.ts        # Generated sitemap.xml
  robots.ts         # Generated robots.txt
  icon.svg          # App icon (SVG)
  favicon.ico       # App icon (ICO, multi-size)
components/         # Shared UI and app-specific components
lib/                # Utilities and API client
hooks/              # React hooks
public/             # Static assets (icons, OG image)
```

## SEO

BLDR ships with SEO-friendly defaults out of the box:

- Custom favicon / app icon set (ICO, SVG, PNG, apple-touch-icon)
- Web App Manifest (installable PWA)
- Open Graph + Twitter card metadata
- Generated `sitemap.xml` and `robots.txt`
- JSON-LD `WebApplication` structured data
- Per-page titles and descriptions

Set `NEXT_PUBLIC_SITE_URL` in production so canonical URLs and the sitemap point to the
right domain.

## License

All rights reserved.
