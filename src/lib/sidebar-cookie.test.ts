import { describe, expect, test } from "bun:test";
import {
  SIDEBAR_COOKIE_NAME,
  getDefaultSidebarOpenFromCookie,
} from "@/lib/sidebar-cookie";

describe("SIDEBAR_COOKIE_NAME", () => {
  test("matches the string the provider writes", () => {
    expect(SIDEBAR_COOKIE_NAME).toBe("sidebar_state");
  });
});

describe("getDefaultSidebarOpenFromCookie", () => {
  test("'true' → open", () => {
    expect(getDefaultSidebarOpenFromCookie("true")).toBe(true);
  });

  test("'false' → closed", () => {
    expect(getDefaultSidebarOpenFromCookie("false")).toBe(false);
  });

  test("undefined falls back to open", () => {
    expect(getDefaultSidebarOpenFromCookie(undefined)).toBe(true);
  });

  test("unknown strings default to open", () => {
    expect(getDefaultSidebarOpenFromCookie("maybe")).toBe(true);
    expect(getDefaultSidebarOpenFromCookie("")).toBe(true);
  });
});
