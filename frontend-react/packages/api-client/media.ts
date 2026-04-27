export function recipeImageUrl(
  recipeId: string,
  size: "original" | "min" | "tiny" = "tiny",
): string {
  const suffix =
    size === "original" ? "original" : size === "min" ? "min-original" : "tiny-original";
  return `/api/media/recipes/${recipeId}/images/${suffix}.webp`;
}
