import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Browse starter templates to kick off your next website built with BLDR's AI website builder.",
  alternates: { canonical: "/templates/" },
  openGraph: {
    title: "Templates · BLDR",
    description: "Starter templates for BLDR's AI website builder.",
    url: "/templates/",
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
