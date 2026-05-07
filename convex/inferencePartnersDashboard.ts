import { query } from "./_generated/server";
import { resolveInferencePartnersDashboardIdentity } from "./lib/auth";

/**
 * Signed-in session for the Inference Partners dashboard (Clerk JWT → Convex identity).
 * Prefer `tokenIdentifier` for ownership checks in mutations; `subject` is the Clerk user id.
 */
export const currentSession = query({
  args: {},
  handler: async (ctx) => {
    const resolved = await resolveInferencePartnersDashboardIdentity(ctx);
    if (resolved.kind === "signed_out") {
      return { access: "signed_out" as const };
    }
    if (resolved.kind === "forbidden") {
      return { access: "forbidden" as const };
    }
    const { identity } = resolved;
    return {
      access: "ok" as const,
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      email: identity.email ?? null,
      name: identity.name ?? null,
    };
  },
});
