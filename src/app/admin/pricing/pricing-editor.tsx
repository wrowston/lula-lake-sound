"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useCallback, useState } from "react";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";

type PricingContent = {
  flags: { priceTabEnabled: boolean };
};

/** Narrow the unioned snapshot returned by `api.cms.getSection` to the pricing shape. */
function toPricingContent(raw: unknown): PricingContent {
  if (
    raw &&
    typeof raw === "object" &&
    "flags" in raw &&
    typeof (raw as { flags?: { priceTabEnabled?: unknown } }).flags
      ?.priceTabEnabled === "boolean"
  ) {
    return {
      flags: {
        priceTabEnabled: (raw as { flags: { priceTabEnabled: boolean } }).flags
          .priceTabEnabled,
      },
    };
  }
  return { flags: { priceTabEnabled: true } };
}

export function PricingEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to manage pricing visibility.
        </p>
      </Unauthenticated>

      <Authenticated>
        <PricingForm />
      </Authenticated>
    </>
  );
}

function PricingForm() {
  const { user } = useUser();
  const section = useQuery(api.cms.getSection, { section: "pricing" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<PricingContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const source: PricingContent | undefined =
    localDraft ??
    (section
      ? toPricingContent(section.draftSnapshot ?? section.publishedSnapshot)
      : undefined);

  const setPriceTabEnabled = useCallback(
    (checked: boolean) => {
      if (!source) return;
      setInlineError(null);
      setLocalDraft({
        ...source,
        flags: { ...source.flags, priceTabEnabled: checked },
      });
    },
    [source],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
      setInlineError(null);
      setBusy(label);
      const outcome = await runAdminEffect(program, {
        onErrorMessage: setInlineError,
      });
      if (outcome !== undefined) {
        setLocalDraft(null);
      }
      setBusy(null);
      return outcome;
    },
    [],
  );

  const hasDraftOnServer = section?.hasDraftChanges ?? false;

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discard({ section: "pricing" })),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    setLocalDraft(null);
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [discard, hasDraftOnServer]);

  if (section === undefined) {
    return <p className="body-text text-muted-foreground">Loading pricing…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">
        No pricing settings available.
      </p>
    );
  }

  const hasLocalEdits = localDraft !== null;

  const publishedByLabel =
    section.publishedBy && user?.id === section.publishedBy ? "You" : undefined;

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="label-text text-muted-foreground">Visibility</legend>
        <div className="flex items-start gap-3">
          <Switch
            id="pricing-price-tab-enabled"
            checked={source.flags.priceTabEnabled}
            onCheckedChange={setPriceTabEnabled}
          />
          <div className="space-y-1">
            <label
              htmlFor="pricing-price-tab-enabled"
              className="body-text-small cursor-pointer text-foreground"
            >
              Show pricing on marketing site
            </label>
            <p className="body-text-small text-muted-foreground">
              Hides pricing on the public site when off. Preview still shows
              the draft value.
            </p>
          </div>
        </div>
      </fieldset>

      <CmsPublishToolbar
        section="pricing"
        sectionLabel="pricing visibility"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={section.publishedAt ?? null}
        publishedByLabel={publishedByLabel}
        busy={busy}
        inlineError={inlineError}
        previewHref="/preview#services-pricing"
        onSaveDraft={() =>
          void runAction(
            "Saving…",
            convexMutationEffect(() =>
              saveDraft({
                section: "pricing",
                content: { flags: source.flags },
              }),
            ),
          )
        }
        onPublish={() => {
          const publishOnce = convexMutationEffect(() =>
            publish({ section: "pricing" }),
          );
          const program = hasLocalEdits
            ? pipe(
                convexMutationEffect(() =>
                  saveDraft({
                    section: "pricing",
                    content: { flags: source.flags },
                  }),
                ),
                Effect.flatMap(() => publishOnce),
              )
            : publishOnce;
          return void runAction("Publishing…", program);
        }}
        onDiscardConfirm={handleDiscardConfirm}
      />
    </div>
  );
}
