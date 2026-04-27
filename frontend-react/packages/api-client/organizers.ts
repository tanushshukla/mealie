import { apiFetch } from "./client";
import type { RecipeTag, RecipeCategory, IngredientFood, PaginationData } from "./types";

export async function listTags(): Promise<RecipeTag[]> {
  const res = await apiFetch<PaginationData<RecipeTag>>("/api/organizers/tags?perPage=300");
  return res.items;
}

export async function listCategories(): Promise<RecipeCategory[]> {
  const res = await apiFetch<PaginationData<RecipeCategory>>(
    "/api/organizers/categories?perPage=300",
  );
  return res.items;
}

export async function listFoods(): Promise<IngredientFood[]> {
  const res = await apiFetch<PaginationData<IngredientFood>>("/api/foods?perPage=500");
  return res.items;
}
