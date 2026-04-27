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
