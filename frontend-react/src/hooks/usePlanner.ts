import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMealPlans,
  createMealPlan,
  deleteMealPlan,
  listShoppingLists,
  getShoppingList,
  updateShoppingItem,
} from "@api-client";
import type { PlanEntryType } from "@api-client";

export const plannerKeys = {
  week: (start: string, end: string) => ["mealplans", start, end] as const,
  shoppingLists: ["shopping", "lists"] as const,
  shoppingList: (id: string) => ["shopping", "list", id] as const,
};

export function useMealPlans(startDate: string, endDate: string) {
  return useQuery({
    queryKey: plannerKeys.week(startDate, endDate),
    queryFn: () => listMealPlans(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateMealPlan(startDate: string, endDate: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: { date: string; entryType: PlanEntryType; recipeId?: string; title?: string }) =>
      createMealPlan(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.week(startDate, endDate) }),
  });
}

export function useDeleteMealPlan(startDate: string, endDate: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMealPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.week(startDate, endDate) }),
  });
}

export function useShoppingLists() {
  return useQuery({
    queryKey: plannerKeys.shoppingLists,
    queryFn: listShoppingLists,
  });
}

export function useShoppingList(id: string) {
  return useQuery({
    queryKey: plannerKeys.shoppingList(id),
    queryFn: () => getShoppingList(id),
    enabled: !!id,
  });
}

export function useToggleShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      updateShoppingItem(id, { checked, shoppingListId: listId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) }),
  });
}
