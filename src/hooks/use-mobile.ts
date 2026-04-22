import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function subscribeToMobileWidth(cb: () => void) {
  const mql = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
  )
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}

function getIsMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

const getServerIsMobile = () => false

export function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobileWidth,
    getIsMobileSnapshot,
    getServerIsMobile,
  )
}
