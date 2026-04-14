import { Effect, Either, pipe } from "effect";
import { toast } from "sonner";
import {
  type CmsAppError,
  cmsErrorToastMessage,
} from "@/lib/effect-errors";

/**
 * Run an admin `Effect` to completion: success returns `A`, failure shows sonner toast.
 */
export async function runAdminEffect<A, E extends CmsAppError>(
  effect: Effect.Effect<A, E, never>,
): Promise<A | undefined> {
  const result = await pipe(effect, Effect.either, Effect.runPromise);
  if (Either.isLeft(result)) {
    toast.error(cmsErrorToastMessage(result.left));
    return undefined;
  }
  return result.right;
}
