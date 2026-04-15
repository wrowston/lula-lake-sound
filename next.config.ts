import { withSentryConfig } from "@sentry/nextjs";
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

const sentryPublicDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";
const sentryEnvironment =
  process.env.SENTRY_ENVIRONMENT ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV ??
  "development";
const sentryRelease =
  process.env.SENTRY_RELEASE ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  "";
/** Mirrors SENTRY_ENABLED so client bundles (instrumentation-client) can read the override. */
const sentryEnabledPublic = process.env.SENTRY_ENABLED ?? "";
const hasSentryBuildUploadConfig = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SENTRY_DSN: sentryPublicDsn,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: sentryEnvironment,
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease,
    NEXT_PUBLIC_SENTRY_ENABLED: sentryEnabledPublic,
  },
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

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  ...(hasSentryBuildUploadConfig
    ? {
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG as string,
        project: process.env.SENTRY_PROJECT as string,
        release: sentryRelease ? { name: sentryRelease } : undefined,
        widenClientFileUpload: true,
      }
    : {
        sourcemaps: {
          disable: true,
        },
      }),
});
