/**
 * CMS / admin Effect error catalog (INF-73).
 * Import tagged errors and `fromConvexCmsError` from here — single entry for app code.
 */
import { Data, Effect } from "effect";
import { ConvexError } from "convex/values";

/** Convex `ConvexError` payload shape (mirrors `convex/errors.ts`). */
export type CmsConvexErrorPayload =
  | { readonly code: "UNAUTHORIZED"; readonly message: string }
  | {
      readonly code: "VALIDATION_ERROR";
      readonly message: string;
      readonly field?: string;
    }
  | {
      readonly code: "NOT_FOUND";
      readonly message: string;
      readonly resource: string;
      readonly id: string;
    }
  | {
      readonly code: "CONFLICT";
      readonly message: string;
      readonly reason?: string;
    }
  | {
      readonly code: "PUBLISH_VALIDATION_FAILED";
      readonly message: string;
      readonly section: string;
    }
  | { readonly code: "UNKNOWN"; readonly message: string };

export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly field?: string;
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  readonly message: string;
  readonly resource: string;
  readonly id: string;
}> {}

export class Conflict extends Data.TaggedError("Conflict")<{
  readonly message: string;
  readonly reason?: string;
}> {}

export class PublishValidationFailed extends Data.TaggedError(
  "PublishValidationFailed",
)<{
  readonly message: string;
  readonly section: string;
}> {}

export type CmsAppError =
  | Unauthorized
  | ValidationError
  | NotFound
  | Conflict
  | PublishValidationFailed;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCmsConvexErrorPayload(
  value: unknown,
): value is CmsConvexErrorPayload {
  if (!isRecord(value)) return false;
  const code = value["code"];
  if (typeof code !== "string") return false;
  if (typeof value["message"] !== "string") return false;
  switch (code) {
    case "UNAUTHORIZED":
      return true;
    case "VALIDATION_ERROR":
      return (
        value["field"] === undefined || typeof value["field"] === "string"
      );
    case "NOT_FOUND":
      return (
        typeof value["resource"] === "string" && typeof value["id"] === "string"
      );
    case "CONFLICT":
      return (
        value["reason"] === undefined || typeof value["reason"] === "string"
      );
    case "PUBLISH_VALIDATION_FAILED":
      return typeof value["section"] === "string";
    case "UNKNOWN":
      return true;
    default:
      return false;
  }
}

/** Map a thrown value from Convex into a tagged `CmsAppError` (no `any`). */
export function fromConvexCmsError(cause: unknown): CmsAppError {
  if (cause instanceof ConvexError) {
    const data: unknown = cause.data;
    if (isCmsConvexErrorPayload(data)) {
      switch (data.code) {
        case "UNAUTHORIZED":
          return new Unauthorized({ message: data.message });
        case "VALIDATION_ERROR":
          return new ValidationError({
            message: data.message,
            ...(data.field !== undefined ? { field: data.field } : {}),
          });
        case "NOT_FOUND":
          return new NotFound({
            message: data.message,
            resource: data.resource,
            id: data.id,
          });
        case "CONFLICT":
          return new Conflict({
            message: data.message,
            ...(data.reason !== undefined ? { reason: data.reason } : {}),
          });
        case "PUBLISH_VALIDATION_FAILED":
          return new PublishValidationFailed({
            message: data.message,
            section: data.section,
          });
        case "UNKNOWN":
          return new ValidationError({ message: data.message });
      }
    }
  }
  if (cause instanceof Error) {
    return new ValidationError({ message: cause.message });
  }
  return new ValidationError({ message: String(cause) });
}

/** Wrap an async Convex client call as `Effect<A, CmsAppError>`. */
export function convexMutationEffect<A>(
  run: () => Promise<A>,
): Effect.Effect<A, CmsAppError> {
  return Effect.tryPromise({
    try: run,
    catch: fromConvexCmsError,
  });
}

export function cmsErrorToastMessage(err: CmsAppError): string {
  switch (err._tag) {
    case "Unauthorized":
      return err.message;
    case "ValidationError":
      return err.field !== undefined
        ? `${err.message} (${err.field})`
        : err.message;
    case "NotFound":
      return err.message;
    case "Conflict":
      return err.reason !== undefined
        ? `${err.message} — ${err.reason}`
        : err.message;
    case "PublishValidationFailed":
      return `[${err.section}] ${err.message}`;
    default: {
      const _exhaustive: never = err;
      return String(_exhaustive);
    }
  }
}
