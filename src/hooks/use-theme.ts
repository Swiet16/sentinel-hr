import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

export function useThemeEffect() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
}