import { useCallback } from "react";

/**
 * Selector for nodes the page-level `IntersectionObserver` should toggle
 * `.in-view` on. Covers the original `.reveal` (translate-up) plus the
 * extended editorial vocabulary defined in `src/app/globals.css`:
 * `.reveal-fade`, `.reveal-clip`, `.reveal-blur`, `.reveal-rule`, `.reveal-axis`,
 * `.reveal-image`. Each variant has its own keyframes but shares the
 * `.in-view` trigger so a single observer covers them all.
 */
const REVEAL_SELECTOR =
  ".reveal, .reveal-fade, .reveal-clip, .reveal-blur, .reveal-rule, .reveal-axis, .reveal-image";

const REVEAL_GROUP_SELECTOR = "[data-reveal-stagger]";

/** Dense thresholds so `intersectionRatio` vs per-element `data-reveal-amount` is accurate. */
const REVEAL_IO_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

function shouldRepeatReveal(el: Element): boolean {
  return el.hasAttribute("data-repeat-reveal");
}

function parseRevealAmount(el: Element): number {
  const raw = el.getAttribute("data-reveal-amount");
  if (raw == null || raw === "") return 0.15;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return 0.15;
  return Math.min(1, Math.max(0, n));
}

function parseRevealSeconds(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const t = value.trim();
  if (t === "0" || t === "0s" || t === "0ms") return 0;
  if (t.endsWith("ms")) {
    const n = Number.parseFloat(t.slice(0, -2));
    return Number.isFinite(n) ? n / 1000 : 0;
  }
  if (t.endsWith("s")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Direct `MotionReveal` / reveal rows under `MotionRevealGroup`, or — when the
 * group wraps a single subtree (e.g. accordion) — descendants with
 * `data-inherit-reveal` owned by this group.
 */
function staggerTargetsForGroup(group: Element): Element[] {
  const children = [...group.children];
  const direct = children.filter(
    (el) => el.matches(REVEAL_SELECTOR) || el.hasAttribute("data-inherit-reveal"),
  );
  if (direct.length > 0) return direct;
  return [...group.querySelectorAll("[data-inherit-reveal]")].filter(
    (el) => el.closest(REVEAL_GROUP_SELECTOR) === group,
  );
}

function applyMotionRevealGroupStagger(root: ParentNode) {
  if (!(root instanceof Element || root instanceof DocumentFragment)) return;
  const groups: Element[] =
    root instanceof Element
      ? root.matches(REVEAL_GROUP_SELECTOR)
        ? [root, ...root.querySelectorAll(REVEAL_GROUP_SELECTOR)]
        : [...root.querySelectorAll(REVEAL_GROUP_SELECTOR)]
      : [...root.querySelectorAll(REVEAL_GROUP_SELECTOR)];

  for (const group of groups) {
    const stagger = parseRevealSeconds(group.getAttribute("data-reveal-stagger"));
    const baseDelay = parseRevealSeconds(group.getAttribute("data-reveal-delay"));
    const targets = staggerTargetsForGroup(group);
    targets.forEach((el, index) => {
      if (!(el instanceof HTMLElement)) return;
      if (!el.dataset.revealStaggerUserDelayCaptured) {
        el.dataset.revealStaggerUserDelayCaptured = "1";
        el.dataset.revealStaggerUserDelay = el.style.animationDelay || "";
      }
      const userDelay = parseRevealSeconds(el.dataset.revealStaggerUserDelay);
      el.style.animationDelay = `${baseDelay + index * stagger + userDelay}s`;
    });
  }
}

/**
 * Ref callback for the page shell: an `IntersectionObserver` that adds
 * `.in-view` to reveal nodes.
 * Implemented as a ref callback (not `useEffect`) per project convention.
 */
export function useScrollAndReveal() {
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const observed = new WeakSet<Element>();
    function observeRevealElement(el: Element) {
      if (observed.has(el)) return;
      if (!shouldRepeatReveal(el) && el.classList.contains("in-view")) return;
      observed.add(el);
      observer.observe(el);
    }
    function observeRevealElementsIn(root: ParentNode) {
      applyMotionRevealGroupStagger(root);
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) {
        observeRevealElement(root);
      }
      root
        .querySelectorAll(REVEAL_SELECTOR)
        .forEach((el) => observeRevealElement(el));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target;
          const amount = parseRevealAmount(target);
          const repeat = shouldRepeatReveal(target);
          const pastAmount = entry.intersectionRatio >= amount;

          if (pastAmount) {
            target.classList.add("in-view");
            if (!repeat) observer.unobserve(target);
          } else if (repeat) {
            target.classList.remove("in-view");
          }
        }
      },
      { threshold: REVEAL_IO_THRESHOLDS, rootMargin: "0px 0px -60px 0px" },
    );
    observeRevealElementsIn(node);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode instanceof DocumentFragment) {
            observeRevealElementsIn(addedNode);
            continue;
          }
          if (!(addedNode instanceof Element)) continue;
          observeRevealElementsIn(addedNode);
        }
      }
    });
    mutationObserver.observe(node, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return { containerRef };
}
