import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lula Lake Sound | Recording Studio | Chattanooga, TN",
  description: "Nestled in serene mountains just outside of Chattanooga, TN - Lula Lake Sound offers artists a natural creative refuge with state-of-the-art equipment and breathtaking surroundings.",
  keywords: "recording studio, Chattanooga, music studio, creative refuge, Lookout Mountain, artists, music production",
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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
