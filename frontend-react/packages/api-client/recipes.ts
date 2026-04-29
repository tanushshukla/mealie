import { apiFetch } from "./client";
import type { Recipe, RecipeSummary, PaginationData, RecipeListParams } from "./types";

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k, String(item)));
    else qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listRecipes(
  params: RecipeListParams,
): Promise<PaginationData<RecipeSummary>> {
  const { page = 1, perPage = 30, ...rest } = params;
  const query = buildQuery({ page, perPage, ...rest });
  return apiFetch<PaginationData<RecipeSummary>>(`/api/recipes${query}`);
}

export async function getRecipe(slug: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/recipes/${slug}`);
}

export async function createRecipeFromUrl(url: string): Promise<string> {
  return apiFetch<string>("/api/recipes/create-url", {
    method: "POST",
    body: JSON.stringify({ url, includeTags: true }),
  });
}

export async function createRecipeFromName(name: string): Promise<string> {
  return apiFetch<string>("/api/recipes", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateRecipe(slug: string, data: Partial<import("./types").Recipe>): Promise<import("./types").Recipe> {
  return apiFetch<import("./types").Recipe>(`/api/recipes/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRecipe(slug: string): Promise<void> {
  return apiFetch<void>(`/api/recipes/${slug}`, { method: "DELETE" });
}
