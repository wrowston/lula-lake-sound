import { useCallback, useState } from "react";

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
 * Ref callback for the page shell: rAF-throttled `scrollY` for the header
 * plus an `IntersectionObserver` that adds `.in-view` to reveal nodes.
 * Implemented as a ref callback (not `useEffect`) per project convention.
 */
export function useScrollAndReveal() {
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    setScrollY(window.scrollY);

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
    node.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return { scrollY, containerRef };
}
