import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployed Builds",
  description:
    "Browse all the websites you've built and deployed with BLDR's AI website builder. Open, preview, and manage your live sites.",
  alternates: { canonical: "/builds/" },
  openGraph: {
    title: "Deployed Builds · BLDR",
    description:
      "All websites you've built and deployed with BLDR's AI website builder.",
    url: "/builds/",
  },
};

export default function BuildsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
