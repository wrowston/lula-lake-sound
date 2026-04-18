import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Titillium_Web } from "next/font/google";
import { cn } from "@/lib/utils";

// Body / supporting copy typeface per the LLS brand guide.
// Verdana is the sanctioned fallback when Titillium Web fails to
// load.  Acumin Variable Concept Wide Semibold (the display face)
// is an Adobe Fonts commercial face that cannot be redistributed
// from an open repository, so we rely on Arial Bold as the brand-
// approved fallback there — see `src/app/globals.css`.
const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium-web",
  display: "swap",
  fallback: ["Verdana", "system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Lula Lake Sound | Recording Studio | Chattanooga, TN",
  description:
    "A natural creative refuge. Lula Lake Sound is a recording studio set in the mountains outside Chattanooga, TN — built for artists who want a quiet, intentional place to make their work.",
  keywords:
    "recording studio, Chattanooga, music studio, creative refuge, Lookout Mountain, artists, music production, boutique studio",
  icons: {
    icon: { url: "/favicon.png", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", titillium.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ClerkProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
