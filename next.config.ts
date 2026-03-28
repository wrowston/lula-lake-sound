import type { NextConfig } from "next";

// Node can install a broken `globalThis.localStorage` when `--localstorage-file` is set
// without a valid path (often via NODE_OPTIONS). Next.js dev UI checks for `localStorage`
// and then calls `getItem`, which throws. Strip it in development only.
if (process.env.NODE_ENV === "development") {
  const g = globalThis as unknown as { localStorage?: unknown };
  const ls = g.localStorage;
  if (ls != null && typeof (ls as Storage).getItem !== "function") {
    Reflect.deleteProperty(g, "localStorage");
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "g3ik3pexma.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
    // Cache optimized images for 31 days to reduce transformations and cache writes
    minimumCacheTTL: 2678400, // 31 days in seconds
    // Use only WebP format to reduce the number of transformations (removes AVIF)
    formats: ['image/webp'],
    // Limit device sizes to common breakpoints only
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Limit image sizes to reduce transformation variants
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Use lower quality to reduce file size and cache operations
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
