# CMS draft / publish model (Convex)

**Ticket:** INF-70  
**Choice:** **Approach B** — one document per CMS **section** with `publishedSnapshot`, optional `draftSnapshot`, `publishedAt`, and `hasDraftChanges`. Publish is a **single `db.patch` / `db.replace`** so public readers never see a half-written structure.

## Public vs admin reads

| Audience | Data |
|----------|------|
| Anonymous / marketing site — metadata | `publishedSnapshot` only (`api.public.getPublishedSiteSettings`) |
| Anonymous / marketing site — pricing flags | `publishedSnapshot` only (`api.public.getPublishedPricingFlags`) |
| Studio / preview — metadata | `api.siteSettingsPreviewDraft.getPreviewSiteSettings` (draft when present, else published; owner-gated) |
| Studio / preview — pricing flags | `api.pricingPreviewDraft.getPreviewPricingFlags` (draft when present, else published; owner-gated) |

### Sections

| Section | Shape | Admin editor |
|---------|-------|--------------|
| `settings` | `{ metadata?: { title, description } }` | `/admin/settings` |
| `pricing`  | `{ flags: { priceTabEnabled } }`         | `/admin/pricing` |
| `about`    | `{ heroTitle, heroSubtitle?, body: Block[], highlights?, seoTitle?, seoDescription? }` (block = `{ type: 'paragraph' \| 'heading', text: string }`) | `/admin/about` |

Each section has its own `cmsSections` row and therefore its own independent draft / publish lifecycle. Publishing one section never publishes another (except via `api.admin.publish.publishSite`, which explicitly iterates all `cmsSections` rows with pending drafts **and** the studio gallery when `galleryPhotoMeta.hasDraftChanges` is true).

> Legacy rows whose `settings.publishedSnapshot` still contains `flags` remain schema-valid thanks to an optional `flags` field on `settingsContentValidator`. Public / preview pricing queries fall back to that legacy location when the `pricing` row hasn’t been written yet, so no migration is required before deploy.

> The `about` body uses a **block array of plain text** (`{type, text}`) rather than a raw markdown string so public renderers never have to parse or sanitize HTML — each block's `text` is rendered as a React text node inside a fixed element chosen by `type`. If raw markdown (with HTML) is introduced later, run it through `rehype-sanitize` in `publishedAboutFromRow` (or the public route loader) before handing off to a renderer.

## Admin UI (Settings, Pricing, Gear)

The shared `CmsPublishToolbar` exposes three actions: **Publish**, **Discard**, and **Preview site**. There is **no explicit "Save draft" button** — editors auto-save local edits via a debounced `useAutosaveDraft` hook (`src/lib/use-autosave-draft.ts`, default 1000ms) that calls the same `api.cms.saveDraft` mutation under the hood. The debounce resets on each edit (idle window from the last keystroke), not only when the editor first becomes dirty. The toolbar renders sticky at the bottom of the admin viewport and shows a subtle `Saving… / Saved / Save failed — retrying` indicator alongside the "Unpublished changes" badge.

Publish flushes any pending autosave first, so fast-clicking Publish after an edit is safe and never loses work.

> The studio gallery (`/admin/photos`) follows the same publish/discard UX, but it uses dedicated `galleryPhotoMeta` / `galleryPhotos` tables because image metadata and storage refs are row-based rather than snapshot-based. See `docs/gallery-photos.md`.

## Mutations (shared pattern)

| Function | Role |
|----------|------|
| `api.cms.saveDraft` | Writes `draftSnapshot`, updates `hasDraftChanges` vs `publishedSnapshot`. Called by the editor's autosave hook on each debounced change. |
| `api.cms.publishSection` | Validates, then copies `draftSnapshot` → `publishedSnapshot`, sets `publishedAt` + `publishedBy` (Clerk user id), clears draft in **one** transaction. Idempotent when there is nothing to publish. |
| `api.admin.publish.publish` | Same as `publishSection` (owner-gated; see `convex/admin/publish.ts`). |
| `api.admin.publish.publishSite` | Validates **all** `cmsSections` rows with pending drafts **and** the gallery draft (when the gallery has pending changes) first; if any fail, **nothing** is published. Otherwise publishes every pending section **and** the gallery (when applicable) in the same transaction. |
| `api.cms.validatePublishSection` | Read-only preflight validation for the effective draft snapshot. |
| `api.cms.discardDraft` | Clears `draftSnapshot` and `hasDraftChanges` with `patch` (optional field removed). No-op if there was nothing to discard. `publishedSnapshot`, `publishedAt`, and `publishedBy` are unchanged. |

## Discard when nothing is published yet

If `publishedAt` is `null`, discarding still only clears the draft; **live site content** remains whatever is already in `publishedSnapshot` (defaults until first publish). The editor preview again matches that stored baseline.

## First-time publish

1. **Empty environment:** run `internal.seed.seedSiteSettingsDefaults` or call `saveDraft` once (both create a row with defaults in `publishedSnapshot` and `publishedAt` set).
2. **Editor saves:** autosave debounces edits and calls `saveDraft`, which fills `draftSnapshot`; `hasDraftChanges` is true when draft ≠ published.
3. **Publish:** the toolbar's Publish action flushes any pending autosave first, then calls `publishSection`, which validates required fields and promotes `draftSnapshot` → `publishedSnapshot`. If there is no draft and `hasDraftChanges` is false, publish is a **no-op** (safe double-click). Set **`CMS_OWNER_TOKEN_IDENTIFIERS`** on the Convex deployment (comma-separated `tokenIdentifier` values) to restrict publish to the studio owner.

## Adding a new content type (new section)

1. **Extend the section union** in `convex/schema.shared.ts`:

   ```ts
   export const cmsSectionValidator = v.union(
     v.literal("settings"),
     v.literal("pricing"), // example
   );
   ```

2. **Define a validator** for that section’s snapshot shape (or reuse an existing one if the payload matches).

3. **Add a table or branch in `cmsSections`:** today one row holds one `settingsContentValidator` snapshot. If the new section has a different shape, either:
   - add optional fields to a shared snapshot object (simple, one row), or
   - add a **separate** `cmsSections`-style table keyed by section name (still one row per section), reusing the same mutation naming pattern in a new module.

4. **Register mutations** that call the same three operations (`saveDraft` / `publishSection` / `discardDraft`) with `section: "pricing"` (or split validators per module if shapes differ).

5. **Expose queries:** add a **`convex/public.ts`** query that reads **only** `publishedSnapshot` (or equivalent published columns) for that section — keep anonymous entry points in this module so grep/review stays simple. If owners need to see drafts on the live layout, add a **separate** module named like `…PreviewDraft.ts` with `requireCmsOwner` and **do not** import that module from marketing routes.

6. **Regenerate types** after adding Convex modules: `bunx convex codegen` (or `convex dev`) updates `convex/_generated/api.d.ts` so `api.public.…` resolves in the app.

## App-layer types

Use `Doc<"cmsSections">` from `convex/_generated/dataModel` for the full persisted row. For field-level types (for example the section key or a snapshot payload), use indexed access on that type, for example `Doc<"cmsSections">["section"]` or `Doc<"cmsSections">["publishedSnapshot"]`.
