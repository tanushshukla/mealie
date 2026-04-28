import { apiFetch } from "./client";
import type { PlanEntry, PlanEntryType, PaginationData } from "./types";

export async function listMealPlans(startDate: string, endDate: string): Promise<PlanEntry[]> {
  const res = await apiFetch<PaginationData<PlanEntry>>(
    `/api/households/mealplans?start_date=${startDate}&end_date=${endDate}&perPage=100`,
  );
  return res.items;
}

export async function createMealPlan(entry: {
  date: string;
  entryType: PlanEntryType;
  recipeId?: string;
  title?: string;
}): Promise<PlanEntry> {
  return apiFetch<PlanEntry>("/api/households/mealplans", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function deleteMealPlan(id: string): Promise<void> {
  return apiFetch<void>(`/api/households/mealplans/${id}`, { method: "DELETE" });
}

export async function listShoppingLists(): Promise<{ id: string; name: string }[]> {
  const res = await apiFetch<PaginationData<{ id: string; name: string }>>(
    "/api/households/shopping/lists?perPage=50",
  );
  return res.items;
}

export async function getShoppingList(id: string): Promise<import("./types").ShoppingList> {
  return apiFetch(`/api/households/shopping/lists/${id}`);
}

export async function updateShoppingItem(
  id: string,
  patch: { checked: boolean; shoppingListId: string },
): Promise<void> {
  return apiFetch(`/api/households/shopping/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}
