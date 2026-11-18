import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://pantrypilot-five.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PantryPilot",
  description: "Plan meals, track your pantry, and shop smarter.",
  applicationName: "PantryPilot",
  openGraph: {
    title: "PantryPilot",
    description: "Plan meals, track your pantry, and shop smarter.",
    siteName: "PantryPilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PantryPilot",
    description: "Plan meals, track your pantry, and shop smarter.",
  },
};

// Tints the mobile browser bar to match the app's top bar (surface colour).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c2024" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
