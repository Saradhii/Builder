import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "./components/navbar";
import { BuilderWorkspaceProvider } from "./components/builder-workspace/context";
import { ThemeScript, ThemeProviderInner } from "./components/theme-provider";
import { WavyBackground } from "@/components/ui/wavy-background";
import { siteConfig } from "./site-config";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [...siteConfig.authors],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  manifest: "/manifest.webmanifest",
  // favicon.ico and icon.svg are provided via files in app/ and are
  // auto-linked by Next.js; PNG sizes below fill in the remaining gaps.
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteConfig.name,
  alternateName: siteConfig.title,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI website generation from natural language prompts",
    "Live preview",
    "Editable HTML output",
    "Multiple AI model selection",
    "Image upload support",
    "One-click export",
  ],
  creator: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen w-screen overflow-hidden" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased h-screen w-screen overflow-hidden flex flex-col">
        <ThemeProviderInner>
          <BuilderWorkspaceProvider>
            <WavyBackground
              waveOpacity={0.5}
              blur={10}
              speed="fast"
              containerClassName="h-full w-full flex flex-col"
              className="h-full w-full flex flex-col"
            >
              <div className="flex-shrink-0 relative z-50">
                <Navbar />
              </div>
              <main className="flex-1 w-full overflow-hidden min-h-0 relative z-0">
                {children}
              </main>
            </WavyBackground>

          </BuilderWorkspaceProvider>
        </ThemeProviderInner>
      </body>
    </html>
  );
}
