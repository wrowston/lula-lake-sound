# CMS draft / publish model (Convex)

**Ticket:** INF-70 (initial model), INF-… (metadata-only `cmsSections` refactor)

`cmsSections` is a **metadata-only** table now: one row per section holding
publish bookkeeping (`hasDraftChanges`, `publishedAt`, `publishedBy`,
`updatedAt`, `updatedBy`) and the section's visibility flag (`isEnabled` with
optional `isEnabledDraft`). Section content lives in dedicated **scoped
tables** using the `scope: "draft" | "published"` column pattern shared with
`gearCategories` / `gearItems` and `galleryPhotos`. Publish is a
single-mutation **scope copy** (`draft → published`) plus a metadata `patch`
so public readers never see a half-written structure.

## Sections

| Section      | Content tables                                                   | Visibility flag controls                       | Admin editor         |
|--------------|------------------------------------------------------------------|------------------------------------------------|----------------------|
| `settings`   | `settingsContent` (scope)                                        | (always on; flag unused)                       | `/admin/settings`    |
| `pricing`    | `pricingPackages` (scope)                                        | Homepage pricing block + primary-nav link      | `/admin/pricing`     |
| `about`      | `aboutContent`, `aboutHighlights`, `aboutTeamMembers` (scope)    | Public `/about` route + homepage nav link      | `/admin/about`       |
| `recordings` | (flag-only; copy lives in `src/app/recordings/recordings-data.ts`) | Public `/recordings` route + homepage nav link | `/admin/audio`       |

Each section has its own `cmsSections` metadata row and therefore its own
independent draft / publish lifecycle. The `isEnabled` flag and its draft
override (`isEnabledDraft`) ride on that same row so the publish toolbar
surfaces flag-only changes as pending edits the same way it surfaces content
edits.

## Public vs admin reads

| Audience                                       | Data                                                                                                           |
|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Anonymous / marketing site — metadata         | `settingsContent` (published) — `api.public.getPublishedSiteSettings`                                           |
| Anonymous / marketing site — pricing          | `pricingPackages` (published) + `cmsSections.pricing.isEnabled` — `api.public.getPublishedPricingFlags`         |
| Anonymous / marketing site — marketing flags  | Reads each section row's `isEnabled` — `api.public.getPublishedMarketingFeatureFlags`                           |
| Anonymous / marketing site — About copy       | `aboutContent` + `aboutHighlights` + `aboutTeamMembers` (published, resolved URLs) — `api.public.getPublishedAbout` |
| Studio / preview — metadata                   | `api.siteSettingsPreviewDraft.getPreviewSiteSettings` (draft when present, else published; owner-gated)         |
| Studio / preview — pricing                    | `api.pricingPreviewDraft.getPreviewPricingFlags` (draft packages when present, else published; owner-gated)     |
| Studio / preview — marketing flags            | `api.cms.getPreviewMarketingFeatureFlags` (owner-gated; applies `isEnabledDraft` overrides)                     |
| Studio / preview — About copy                 | `api.aboutPreviewDraft.getPreviewAbout` (draft scope, falls back to published; owner-gated)                     |

## Admin UI

The shared `CmsPublishToolbar` exposes three actions: **Publish**,
**Discard**, and **Preview site**. There is **no explicit "Save draft"
button** — editors auto-save local edits via a debounced
`useAutosaveDraft` hook (`src/lib/use-autosave-draft.ts`, default 1000ms).

During the transition the existing content editors still call the
whole-snapshot `api.cms.saveDraft` mutation. Internally that mutation
decomposes the snapshot into per-section scoped-table rows at
`scope="draft"` and updates `cmsSections.hasDraftChanges` via the shared
`recomputeSectionHasDraftChanges` helper. Admin editors can migrate to
fine-grained mutations incrementally without any public-API change.

The visibility-flag hook (`src/lib/use-marketing-feature-flags-admin.ts`)
targets the new
`api.cms.saveSectionIsEnabledDraft` / `api.cms.publishMarketingFlags` /
`api.cms.discardMarketingFlagsDraft` mutations and reads
`api.cms.listMarketingFlagsDraft`.

## Mutations (shared pattern)

| Function                                   | Role                                                                                                                                                                                                      |
|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `api.cms.saveDraft`                        | Compat shim: decomposes a snapshot-shaped payload into the section's scoped-table rows at `scope="draft"`; recomputes `hasDraftChanges`. Called by the editors' autosave.                                   |
| `api.cms.saveSectionIsEnabledDraft`        | Writes `isEnabledDraft` on the section's `cmsSections` row and recomputes `hasDraftChanges`.                                                                                                               |
| `api.cms.publishSection`                   | Validates, then copies the section's `scope="draft"` rows onto `scope="published"` and applies `isEnabledDraft → isEnabled` in one transaction. Idempotent when nothing pending.                              |
| `api.admin.publish.publish`                | Same as `publishSection` (owner-gated; see `convex/admin/publish.ts`).                                                                                                                                     |
| `api.admin.publish.publishSite`            | Validates every `cmsSections` row with pending drafts **and** the studio gallery when `galleryPhotoMeta.hasDraftChanges` is true. If any fail, **nothing** is published. Otherwise publishes every pending part. |
| `api.cms.validatePublishSection`           | Read-only preflight validation for the section's draft scope.                                                                                                                                              |
| `api.cms.discardDraft`                     | Copies `scope="published"` rows onto `scope="draft"`, clears `isEnabledDraft`, and clears `hasDraftChanges` in one transaction. No-op when nothing is pending.                                              |
| `api.cms.publishMarketingFlags`            | Convenience wrapper around `publishSectionCore` for About / Recordings / Pricing — publishes whichever sections have pending flag changes.                                                                  |
| `api.cms.discardMarketingFlagsDraft`       | Clears `isEnabledDraft` on About / Recordings / Pricing without rewinding content drafts.                                                                                                                  |

## Discard when nothing is published yet

If `publishedAt` is `null`, discarding still only clears the draft scope;
**live site content** remains whatever is already at `scope="published"`
(defaults until first publish). The editor preview again matches that stored
baseline.

## First-time publish

1. **Empty environment:** run `internal.seed.seedSiteSettingsDefaults` (or
   let `ensureSectionMetaRow` lazily create rows as they're saved). The seed
   inserts four `cmsSections` metadata rows and seeds `scope="published"`
   content for settings / about / pricing from the shipped defaults.
2. **Editor saves:** autosave debounces edits and calls the shim
   `saveDraft` mutation, which writes `scope="draft"` rows and recomputes
   `hasDraftChanges`.
3. **Publish:** the toolbar's Publish action flushes any pending autosave
   first, then calls `publishSection`, which validates the draft scope and
   promotes it to `scope="published"`. Flag-only toggles also flow through
   `publishSection`. Set **`CMS_OWNER_TOKEN_IDENTIFIERS`** on the Convex
   deployment (comma-separated `tokenIdentifier` values) to restrict
   publish to the studio owner.

## Adding a new section

1. **Add the section literal** to `cmsSectionValidator` in
   `convex/schema.shared.ts`.
2. **Pick a content shape.** Use the gear/photos pattern: one or more
   scoped content tables with a `scope: "draft" | "published"` column and
   stable-id indexes.
3. **Add copy/delete helpers** alongside the per-section tree helpers
   (e.g. `convex/aboutTree.ts`).
4. **Teach `publishSectionCore`** and `sectionHasPendingDraft` about the
   new section so publish and `hasDraftChanges` maintenance work.
5. **Add public/preview queries** reading `scope="published"` (and
   `scope="draft"` for owner-gated preview).
6. **Register mutations** that write to `scope="draft"` rows and call
   `recomputeSectionHasDraftChanges` at the end.
7. **Regenerate types** with `bunx convex codegen` (or `convex dev`).

## App-layer types

Use `Doc<"cmsSections">` from `convex/_generated/dataModel` for the
metadata row, and the per-table docs (`Doc<"aboutContent">`, etc.) for
content rows.
