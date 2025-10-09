import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dkuutzbetixirzfzlujp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
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
