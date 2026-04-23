"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const isClient = useIsClient();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Avoid hydration mismatch: resolved theme differs between SSR and first client paint.
  const ariaLabel =
    !isClient
      ? "Toggle theme"
      : resolvedTheme === "light" || resolvedTheme === "dark"
        ? isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
        : "Toggle theme";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      className="size-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className="size-4 hidden dark:block" aria-hidden />
      <Moon className="size-4 block dark:hidden" aria-hidden />
    </Button>
  );
}
