import { useQuery } from "@tanstack/react-query";
import { listRecipes, getRecipe } from "@api-client";
import type { RecipeListParams } from "@api-client";

export const recipeKeys = {
  all: ["recipes"] as const,
  list: (params: RecipeListParams) => ["recipes", "list", params] as const,
  detail: (slug: string) => ["recipes", "detail", slug] as const,
};

export function useRecipes(params: RecipeListParams) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => listRecipes(params),
  });
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: recipeKeys.detail(slug),
    queryFn: () => getRecipe(slug),
    enabled: !!slug,
  });
}
