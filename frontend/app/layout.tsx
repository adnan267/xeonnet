import type { Metadata, Viewport } from "next";
import { themeScript } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xeonnet.site"),
  title: { default: "Xeon Net | Full Stack Development & Digital Solution", template: "%s | Xeon Net" },
  description: "Xeon Net: IT services since 2007. From networking and hosting to full stack development, mobile apps, cloud, cyber security and AI.",
  icons: { icon: "/img/favicon.png" },
  openGraph: { siteName: "Xeon Net", type: "website", images: ["/img/logo-full.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0B0B0C" }, { media: "(prefers-color-scheme: light)", color: "#FAF8F5" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cinzel:wght@600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
