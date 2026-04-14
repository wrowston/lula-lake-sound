/** Must match the cookie written by `SidebarProvider` in `components/ui/sidebar.tsx`. */
export const SIDEBAR_COOKIE_NAME = "sidebar_state"

/** Values written by the client are `"true"` / `"false"` (boolean stringified). */
export function getDefaultSidebarOpenFromCookie(
  value: string | undefined
): boolean {
  if (value === "true") return true
  if (value === "false") return false
  return true
}
