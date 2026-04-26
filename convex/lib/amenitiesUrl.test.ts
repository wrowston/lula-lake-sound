import { describe, expect, test } from "bun:test";
import {
  normalizeAmenitiesWebsiteInput,
  websiteForStorage,
} from "./amenitiesUrl";

describe("normalizeAmenitiesWebsiteInput", () => {
  test("returns null for empty", () => {
    expect(normalizeAmenitiesWebsiteInput("")).toBeNull();
    expect(normalizeAmenitiesWebsiteInput("   ")).toBeNull();
  });

  test("adds https when scheme missing", () => {
    expect(normalizeAmenitiesWebsiteInput("example.com/foo")).toBe(
      "https://example.com/foo",
    );
  });

  test("accepts http and https", () => {
    expect(normalizeAmenitiesWebsiteInput("https://a.test")).toBe(
      "https://a.test/",
    );
    expect(normalizeAmenitiesWebsiteInput("http://b.test")).toBe("http://b.test/");
  });

  test("rejects javascript: URLs", () => {
    expect(normalizeAmenitiesWebsiteInput("javascript:alert(1)")).toBeNull();
  });
});

describe("websiteForStorage", () => {
  test("upgrades http to https", () => {
    expect(websiteForStorage("http://canopylkt.com/")).toBe(
      "https://canopylkt.com/",
    );
  });
});
