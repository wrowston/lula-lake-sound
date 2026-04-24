import { describe, expect, test } from "bun:test";
import { MAX_REVEAL_DELAY, revealDelay } from "@/lib/reveal-delay";

describe("revealDelay", () => {
  test("step 0 (or negative) drops the delay suffix", () => {
    expect(revealDelay(0)).toBe("reveal");
    expect(revealDelay(-1)).toBe("reveal");
  });

  test("step 1..MAX returns reveal-delay-N", () => {
    for (let i = 1; i <= MAX_REVEAL_DELAY; i += 1) {
      expect(revealDelay(i)).toBe(`reveal reveal-delay-${i}`);
    }
  });

  test("step above MAX clamps to MAX", () => {
    expect(revealDelay(MAX_REVEAL_DELAY + 5)).toBe(
      `reveal reveal-delay-${MAX_REVEAL_DELAY}`,
    );
  });
});
