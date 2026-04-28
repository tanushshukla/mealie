import { useQuery } from "@tanstack/react-query";
import { listTags, listCategories, listFoods } from "@api-client";

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: listTags, staleTime: 1000 * 60 * 10 });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: listCategories, staleTime: 1000 * 60 * 10 });
}

export function useFoods() {
  return useQuery({ queryKey: ["foods"], queryFn: listFoods, staleTime: 1000 * 60 * 10 });
}
