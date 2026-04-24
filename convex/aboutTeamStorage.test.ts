import { describe, expect, test } from "bun:test";
import { MAX_ABOUT_TEAM_MEMBERS } from "./aboutTeamStorage";

describe("MAX_ABOUT_TEAM_MEMBERS", () => {
  test("is positive and reasonably small", () => {
    expect(MAX_ABOUT_TEAM_MEMBERS).toBeGreaterThan(0);
    expect(MAX_ABOUT_TEAM_MEMBERS).toBeLessThan(1000);
  });

  test("is currently 20 — keep in sync with the admin editor cap", () => {
    expect(MAX_ABOUT_TEAM_MEMBERS).toBe(20);
  });
});
