import { ConvexError, v, type Infer } from "convex/values";

/**
 * Structured CMS failure payload for `ConvexError` (INF-73).
 * Keep in sync with `src/lib/effect-errors.ts` (`fromConvexCmsError`).
 */
export const cmsConvexErrorValidator = v.union(
  v.object({
    code: v.literal("UNAUTHORIZED"),
    message: v.string(),
    kind: v.optional(
      v.union(v.literal("sign_in_required"), v.literal("forbidden")),
    ),
  }),
  v.object({
    code: v.literal("VALIDATION_ERROR"),
    message: v.string(),
    field: v.optional(v.string()),
  }),
  v.object({
    code: v.literal("NOT_FOUND"),
    message: v.string(),
    resource: v.string(),
    id: v.string(),
  }),
  v.object({
    code: v.literal("CONFLICT"),
    message: v.string(),
    reason: v.optional(v.string()),
  }),
  v.object({
    code: v.literal("PUBLISH_VALIDATION_FAILED"),
    message: v.string(),
    section: v.string(),
    issues: v.optional(
      v.array(
        v.object({
          path: v.string(),
          message: v.string(),
        }),
      ),
    ),
  }),
  v.object({
    code: v.literal("UNKNOWN"),
    message: v.string(),
  }),
);

export type CmsConvexError = Infer<typeof cmsConvexErrorValidator>;

export function cmsUnauthorized(
  message: string,
  kind?: "sign_in_required" | "forbidden",
): never {
  throw new ConvexError<CmsConvexError>({
    code: "UNAUTHORIZED",
    message,
    ...(kind !== undefined ? { kind } : {}),
  });
}

export function cmsValidationError(
  message: string,
  field?: string,
): never {
  throw new ConvexError<CmsConvexError>({
    code: "VALIDATION_ERROR",
    message,
    ...(field !== undefined ? { field } : {}),
  });
}

export function cmsNotFound(
  resource: string,
  id: string,
  message?: string,
): never {
  throw new ConvexError<CmsConvexError>({
    code: "NOT_FOUND",
    message: message ?? `${resource} not found: ${id}`,
    resource,
    id,
  });
}

export function cmsConflict(message: string, reason?: string): never {
  throw new ConvexError<CmsConvexError>({
    code: "CONFLICT",
    message,
    ...(reason !== undefined ? { reason } : {}),
  });
}

export function cmsPublishValidationFailed(
  section: string,
  message: string,
  issues?: Array<{ path: string; message: string }>,
): never {
  throw new ConvexError<CmsConvexError>({
    code: "PUBLISH_VALIDATION_FAILED",
    message,
    section,
    ...(issues !== undefined && issues.length > 0 ? { issues } : {}),
  });
}
