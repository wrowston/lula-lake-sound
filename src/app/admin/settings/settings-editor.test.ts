import { describe, expect, test } from "bun:test";
import { toSettingsContent } from "./settings-editor";

describe("toSettingsContent", () => {
  test("keeps metadata verbatim", () => {
    const result = toSettingsContent({
      metadata: { title: "Hi", description: "Ho" },
    });
    expect(result.metadata).toEqual({ title: "Hi", description: "Ho" });
  });

  test("preserves legacy flags.priceTabEnabled when present", () => {
    const result = toSettingsContent({
      metadata: {},
      flags: { priceTabEnabled: true },
    });
    expect(result.flags).toEqual({ priceTabEnabled: true });
  });

  test("drops flags when priceTabEnabled is not a boolean", () => {
    const result = toSettingsContent({
      metadata: {},
      flags: { priceTabEnabled: undefined },
    });
    expect(result.flags).toBeUndefined();
  });

  test("drops flags entirely when input omits them", () => {
    const result = toSettingsContent({ metadata: {} });
    expect(result.flags).toBeUndefined();
  });

  test("legacy priceTabEnabled=false round-trips", () => {
    const result = toSettingsContent({
      metadata: {},
      flags: { priceTabEnabled: false },
    });
    expect(result.flags).toEqual({ priceTabEnabled: false });
  });
});
