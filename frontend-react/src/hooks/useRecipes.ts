import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecipes, getRecipe, createRecipeFromUrl, createRecipeFromName } from "@api-client";
import type { RecipeListParams } from "@api-client";

export const recipeKeys = {
  all: ["recipes"] as const,
  list: (params: RecipeListParams) => ["recipes", "list", params] as const,
  infinite: (params: RecipeListParams) => ["recipes", "infinite", params] as const,
  detail: (slug: string) => ["recipes", "detail", slug] as const,
};

export function useRecipes(params: RecipeListParams) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => listRecipes(params),
  });
}

export function useInfiniteRecipes(params: RecipeListParams) {
  return useInfiniteQuery({
    queryKey: recipeKeys.infinite(params),
    queryFn: ({ pageParam }) => listRecipes({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
  });
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: recipeKeys.detail(slug),
    queryFn: () => getRecipe(slug),
    enabled: !!slug,
  });
}

export function useCreateRecipeFromUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => createRecipeFromUrl(url),
    onSuccess: () => qc.invalidateQueries({ queryKey: recipeKeys.all }),
  });
}

export function useCreateRecipeFromName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createRecipeFromName(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: recipeKeys.all }),
  });
}
