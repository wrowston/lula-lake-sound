import { describe, expect, test } from "bun:test";
import { cn } from "@/lib/utils";

describe("cn", () => {
  test("joins truthy class names with a space", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  test("drops falsy values (null, undefined, false)", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  test("supports clsx-style object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  test("supports nested arrays", () => {
    expect(cn(["a", ["b", "c"]])).toBe("a b c");
  });

  test("twMerge collapses duplicate Tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-base")).toBe("text-base");
  });

  test("empty call returns empty string", () => {
    expect(cn()).toBe("");
  });
});
