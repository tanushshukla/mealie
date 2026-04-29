import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecipes, getRecipe, createRecipeFromUrl, createRecipeFromName, updateRecipe, deleteRecipe, updateRecipeImage, patchRecipe, markLastMade, getComments, createComment, deleteComment } from "@api-client";
import type { Recipe } from "@api-client";
import type { RecipeListParams } from "@api-client";
import { toast } from "../lib/toast";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      toast.success("Recipe imported");
    },
    onError: () => toast.error("Failed to import recipe"),
  });
}

export function useCreateRecipeFromName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createRecipeFromName(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      toast.success("Recipe created");
    },
    onError: () => toast.error("Failed to create recipe"),
  });
}

export function useUpdateRecipe(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Recipe>) => updateRecipe(slug, data),
    onSuccess: (updated) => {
      qc.setQueryData(recipeKeys.detail(updated.slug ?? slug), updated);
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      toast.success("Recipe saved");
    },
    onError: () => toast.error("Failed to save recipe"),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteRecipe(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      toast.success("Recipe deleted");
    },
    onError: () => toast.error("Failed to delete recipe"),
  });
}

export function useRateRecipe(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) => patchRecipe(slug, { rating }),
    onSuccess: (updated) => {
      qc.setQueryData(recipeKeys.detail(slug), updated);
      qc.invalidateQueries({ queryKey: recipeKeys.all });
    },
    onError: () => toast.error("Failed to save rating"),
  });
}

export function useMarkLastMade(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markLastMade(slug, new Date().toISOString()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(slug) });
      toast.success("Marked as made today");
    },
    onError: () => toast.error("Failed to update"),
  });
}

export const commentKeys = {
  list: (slug: string) => ["comments", slug] as const,
};

export function useComments(slug: string) {
  return useQuery({
    queryKey: commentKeys.list(slug),
    queryFn: () => getComments(slug),
    enabled: !!slug,
  });
}

export function useCreateComment(slug: string, recipeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => createComment(recipeId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.list(slug) }),
    onError: () => toast.error("Failed to post comment"),
  });
}

export function useDeleteComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.list(slug) }),
    onError: () => toast.error("Failed to delete comment"),
  });
}

export function useUpdateRecipeImage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => updateRecipeImage(slug, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(slug) });
      toast.success("Photo updated");
    },
    onError: () => toast.error("Failed to upload photo"),
  });
}
