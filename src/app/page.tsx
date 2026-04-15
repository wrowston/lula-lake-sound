"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

export default function Home() {
  const settings = useQuery(api.siteSettings.getPublished);
  return <HomepageShell settings={settings ?? null} />;
}
