import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../lib/toast";
import {
  listMealPlans,
  createMealPlan,
  deleteMealPlan,
  listShoppingLists,
  getShoppingList,
  updateShoppingItem,
  addRecipeToShoppingList,
  createShoppingItem,
  deleteShoppingItem,
  deleteShoppingItems,
  createShoppingList,
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

export function useAddToMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: { date: string; entryType: PlanEntryType; recipeId?: string; title?: string }) =>
      createMealPlan(entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mealplans"] });
      toast.success("Added to meal plan");
    },
    onError: () => toast.error("Failed to add to meal plan"),
  });
}

export function useAddRecipeToShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, recipeId }: { listId: string; recipeId: string }) =>
      addRecipeToShoppingList(listId, recipeId),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) });
      toast.success("Added to shopping list");
    },
    onError: () => toast.error("Failed to add to shopping list"),
  });
}

export function useCreateShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => createShoppingItem(listId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) }),
    onError: () => toast.error("Failed to add item"),
  });
}

export function useDeleteShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShoppingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) }),
    onError: () => toast.error("Failed to remove item"),
  });
}

export function useClearCheckedItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteShoppingItems(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) });
      toast.success("Cleared checked items");
    },
    onError: () => toast.error("Failed to clear items"),
  });
}

export function useClearAllItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteShoppingItems(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plannerKeys.shoppingList(listId) });
      toast.success("List cleared");
    },
    onError: () => toast.error("Failed to clear list"),
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createShoppingList(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: plannerKeys.shoppingLists }),
    onError: () => toast.error("Failed to create list"),
  });
}
