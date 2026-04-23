import { permanentRedirect } from "next/navigation";

/** Legacy URL — feature toggles now live on About, Pricing, and Audio admin pages. */
export default function AdminFeatureFlagsRedirect() {
  permanentRedirect("/admin");
}
