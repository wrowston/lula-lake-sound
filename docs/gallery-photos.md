# Gallery photos (Convex)

The studio gallery uses dedicated Convex tables instead of storing image metadata inline on `cmsSections`.

## Data model

- `galleryPhotoMeta`
  - singleton row keyed by `singletonKey: "default"`
  - tracks `hasDraftChanges`, `publishedAt`, `publishedBy`, `updatedAt`, `updatedBy`
- `galleryPhotos`
  - one row per photo per scope
  - fields: `scope`, `stableId`, `storageId`, `alt`, `caption?`, `width?`, `height?`, `sortOrder`, `contentType`, `sizeBytes`, `originalFileName?`

The Convex dashboard stays readable because each photo row shows the authored metadata plus the backing `_storage` id.

## Draft / publish choice

This implementation uses **shared blobs with separate draft/published metadata rows**:

- uploads always create a **draft** `galleryPhotos` row
- publish copies the draft rows into the **published** scope
- both scopes can reference the same `storageId`
- publish does **not** duplicate the blob in Convex file storage

That keeps uploads cheap while still allowing the draft order and metadata to diverge from what the public site shows.

## Upload flow

1. `api.admin.photos.generateUploadUrl`
2. client `POST`s the file to Convex storage
3. `api.admin.photos.saveUploadedPhoto`
   - validates content type: JPEG / PNG / WebP only
   - validates max size: 50 MB
   - stores metadata on the draft row
   - updates draft/published change tracking

## Delete and GC behavior

- Deleting a draft photo removes the draft row immediately.
- The blob is deleted only when **no other `galleryPhotos` row still references that `storageId`**.
  - If the photo was never published, the draft delete removes the blob too.
  - If the published scope still references that blob, the blob stays until the published reference is replaced or removed.
- Publishing draft over published garbage-collects any blobs that were referenced only by the old published rows.
- Discarding draft over published garbage-collects any blobs that were referenced only by the old draft rows.

This shared-reference rule avoids orphaned files without breaking the currently published gallery.
