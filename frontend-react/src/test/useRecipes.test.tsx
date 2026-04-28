import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { useRecipes, useRecipe } from "../hooks/useRecipes";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useRecipes", () => {
  it("returns recipe items", async () => {
    server.use(
      http.get("http://localhost:3000/api/recipes", () =>
        HttpResponse.json({
          page: 1,
          per_page: 30,
          total: 1,
          total_pages: 1,
          items: [{ id: "1", name: "Pasta", slug: "pasta" }],
        }),
      ),
    );
    const { result } = renderHook(() => useRecipes({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

describe("useRecipe", () => {
  it("fetches single recipe", async () => {
    server.use(
      http.get("http://localhost:3000/api/recipes/pasta", () =>
        HttpResponse.json({ id: "1", name: "Pasta", slug: "pasta" }),
      ),
    );
    const { result } = renderHook(() => useRecipe("pasta"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("Pasta");
  });
});
