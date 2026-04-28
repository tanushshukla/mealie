import type { ReactNode } from "react";

interface RecipeGridProps {
  children: ReactNode;
  variant?: "default" | "lg";
}

export function RecipeGrid({ children, variant = "default" }: RecipeGridProps) {
  const cols =
    variant === "lg"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return <div className={`grid gap-4 ${cols}`}>{children}</div>;
}
