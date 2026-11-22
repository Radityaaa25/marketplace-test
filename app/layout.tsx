import type { Metadata } from "next";
import "./globals.css";

const description =
  "Discover, buy, and sell great finds in your community on Marketplace.";

export const metadata: Metadata = {
  title: {
    default: "Marketplace — Buy and sell locally",
    template: "%s | Marketplace",
  },
  description,
  applicationName: "Marketplace",
  openGraph: {
    title: "Marketplace — Buy and sell locally",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace — Buy and sell locally",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
