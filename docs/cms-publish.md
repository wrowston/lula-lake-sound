# CMS draft / publish model (Convex)

**Ticket:** INF-70  
**Choice:** **Approach B** — one document per CMS **section** with `publishedSnapshot`, optional `draftSnapshot`, `publishedAt`, and `hasDraftChanges`. Publish is a **single `db.patch` / `db.replace`** so public readers never see a half-written structure.

## Public vs admin reads

| Audience | Data |
|----------|------|
| Anonymous / marketing site | `publishedSnapshot` only (e.g. `api.public.getPublishedSiteSettings`) |
| Studio / preview | `api.siteSettingsPreviewDraft.getPreviewSiteSettings` (draft when present, else published; owner-gated) |

## Mutations (shared pattern)

| Function | Role |
|----------|------|
| `api.cms.saveDraft` | Writes `draftSnapshot`, updates `hasDraftChanges` vs `publishedSnapshot`. |
| `api.cms.publishSection` | Validates, then copies `draftSnapshot` → `publishedSnapshot`, sets `publishedAt` + `publishedBy` (Clerk user id), clears draft in **one** transaction. Idempotent when there is nothing to publish. |
| `api.admin.publish.publish` | Same as `publishSection` (owner-gated; see `convex/admin/publish.ts`). |
| `api.admin.publish.publishSite` | Validates **all** sections with pending drafts first; if any fail, **no** section is published. Otherwise publishes each in the same transaction. |
| `api.cms.validatePublishSection` | Read-only preflight validation for the effective draft snapshot. |
| `api.cms.discardDraft` | Clears `draftSnapshot` and `hasDraftChanges` with `patch` (optional field removed). No-op if there was nothing to discard. `publishedSnapshot`, `publishedAt`, and `publishedBy` are unchanged. |

## Discard when nothing is published yet

If `publishedAt` is `null`, discarding still only clears the draft; **live site content** remains whatever is already in `publishedSnapshot` (defaults until first publish). The editor preview again matches that stored baseline.

## First-time publish

1. **Empty environment:** run `internal.seed.seedSiteSettingsDefaults` or call `saveDraft` once (both create a row with defaults in `publishedSnapshot` and `publishedAt` set).
2. **Editor saves:** `saveDraft` fills `draftSnapshot`; `hasDraftChanges` is true when draft ≠ published.
3. **Publish:** Save a draft first. `publishSection` validates required fields, then promotes `draftSnapshot` → `publishedSnapshot`. If there is no draft and `hasDraftChanges` is false, publish is a **no-op** (safe double-click). Set **`CMS_OWNER_TOKEN_IDENTIFIERS`** on the Convex deployment (comma-separated `tokenIdentifier` values) to restrict publish to the studio owner.

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
