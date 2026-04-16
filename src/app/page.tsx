"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

export default function Home() {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  return <HomepageShell pricingFlags={pricingFlags ?? null} />;
}
