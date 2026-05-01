import { useCallback } from "react";

/**
 * Selector for nodes the page-level `IntersectionObserver` should toggle
 * `.in-view` on. Covers the original `.reveal` (translate-up) plus the
 * extended editorial vocabulary defined in `src/app/globals.css`:
 * `.reveal-clip`, `.reveal-blur`, `.reveal-rule`, `.reveal-axis`,
 * `.reveal-image`. Each variant has its own keyframes but shares the
 * `.in-view` trigger so a single observer covers them all.
 */
const REVEAL_SELECTOR =
  ".reveal, .reveal-clip, .reveal-blur, .reveal-rule, .reveal-axis, .reveal-image";

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
      if (observed.has(el) || el.classList.contains("in-view")) return;
      observed.add(el);
      observer.observe(el);
    }
    function observeRevealElementsIn(root: ParentNode) {
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
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observeRevealElementsIn(node);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
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
