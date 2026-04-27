import { describe, expect, test } from "bun:test";
import { ADMIN_MANAGE_NAV_ITEMS } from "@/lib/admin-nav";

describe("ADMIN_MANAGE_NAV_ITEMS", () => {
  test("includes every CMS admin destination expected by the sidebar", () => {
    const hrefs = ADMIN_MANAGE_NAV_ITEMS.map((i) => i.href);
    expect(hrefs).toEqual([
      "/admin/about",
      "/admin/photos",
      "/admin/gear",
      "/admin/audio",
      "/admin/pricing",
      "/admin/amenities-nearby",
      "/admin/faq",
      "/admin/videos",
      "/admin/settings",
    ]);
  });

  test("every entry has a title, description, and icon", () => {
    for (const item of ADMIN_MANAGE_NAV_ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
    }
  });

  test("all admin hrefs are scoped under /admin", () => {
    for (const item of ADMIN_MANAGE_NAV_ITEMS) {
      expect(item.href.startsWith("/admin/")).toBe(true);
    }
  });

  test("hrefs are unique", () => {
    const hrefs = ADMIN_MANAGE_NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
