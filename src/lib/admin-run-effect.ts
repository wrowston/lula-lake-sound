import { Effect, Either, pipe } from "effect";
import { toast } from "sonner";
import {
  type CmsAppError,
  cmsErrorToastMessage,
} from "@/lib/effect-errors";

export type RunAdminEffectOptions = {
  /** Optional inline error (e.g. below a form) in addition to the toast. */
  readonly onErrorMessage?: (message: string) => void;
};

/**
 * Run an admin `Effect` to completion: success returns `A`, failure shows sonner toast.
 */
export async function runAdminEffect<A, E extends CmsAppError>(
  effect: Effect.Effect<A, E, never>,
  options?: RunAdminEffectOptions,
): Promise<A | undefined> {
  const result = await pipe(effect, Effect.either, Effect.runPromise);
  if (Either.isLeft(result)) {
    const err = result.left;
    if (
      err._tag === "Unauthorized" &&
      err.kind === "sign_in_required" &&
      typeof window !== "undefined"
    ) {
      window.location.assign("/sign-in");
      return undefined;
    }
    const msg = cmsErrorToastMessage(err);
    toast.error(msg);
    options?.onErrorMessage?.(msg);
    return undefined;
  }
  return result.right;
}
