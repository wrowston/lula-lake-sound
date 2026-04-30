import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexPublicProvider } from "@/components/convex-public-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Brand fonts — files in `src/fonts/` copied from the Lula Lake Sound Typefaces kit.
 *
 * - Acumin Variable Concept — display / headlines (“Wide Semibold” via wght 600 + wdth 115 in CSS).
 * - Titillium Web — full static family (extra light through black + italics where provided).
 *   Preload is off for Titillium so first paint does not issue many high-priority font
 *   requests; faces load on demand with `display: swap` (Acumin stays preloaded for hero).
 * - Verdana + Arial — guide-approved system fallbacks (not redistributed).
 */
const acuminVariableConcept = localFont({
  src: "../fonts/AcuminVariableConcept.otf",
  variable: "--font-acumin-variable-concept",
  weight: "100 900",
  display: "swap",
  preload: true,
});

const titillium = localFont({
  src: [
    {
      path: "../fonts/TitilliumWeb-ExtraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/TitilliumWeb-ExtraLightItalic.otf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../fonts/TitilliumWeb-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/TitilliumWeb-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/TitilliumWeb-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/TitilliumWeb-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/TitilliumWeb-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/TitilliumWeb-SemiBoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/TitilliumWeb-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/TitilliumWeb-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/TitilliumWeb-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-titillium",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Lula Lake Sound | Recording Studio | Chattanooga, TN",
  description:
    "Nestled in serene mountains just outside of Chattanooga, TN - Lula Lake Sound offers artists a natural creative refuge with state-of-the-art equipment and breathtaking surroundings.",
  keywords:
    "recording studio, Chattanooga, music studio, creative refuge, Lookout Mountain, artists, music production",
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
      className={cn(
        "font-sans",
        acuminVariableConcept.variable,
        titillium.variable,
      )}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ClerkProvider>
            <ConvexPublicProvider>{children}</ConvexPublicProvider>
          </ClerkProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
