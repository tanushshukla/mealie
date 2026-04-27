import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../src/test/server";
import { listRecipes, getRecipe } from "../recipes";
import { listTags, listCategories } from "../organizers";
import { recipeImageUrl } from "../media";

describe("listRecipes", () => {
  it("returns paginated recipes", async () => {
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
    const result = await listRecipes({});
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Pasta");
  });

  it("forwards search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get("http://localhost:3000/api/recipes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ page: 1, per_page: 30, total: 0, total_pages: 0, items: [] });
      }),
    );
    await listRecipes({ search: "chicken" });
    expect(capturedUrl).toContain("search=chicken");
  });

  it("forwards tags array params", async () => {
    let capturedUrl = "";
    server.use(
      http.get("http://localhost:3000/api/recipes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ page: 1, per_page: 30, total: 0, total_pages: 0, items: [] });
      }),
    );
    await listRecipes({ tags: ["italian", "quick"] });
    expect(capturedUrl).toContain("tags=italian");
    expect(capturedUrl).toContain("tags=quick");
  });
});

describe("getRecipe", () => {
  it("returns a recipe by slug", async () => {
    server.use(
      http.get("http://localhost:3000/api/recipes/pasta-bolognese", () =>
        HttpResponse.json({ id: "1", name: "Pasta Bolognese", slug: "pasta-bolognese" }),
      ),
    );
    const recipe = await getRecipe("pasta-bolognese");
    expect(recipe.name).toBe("Pasta Bolognese");
  });
});

describe("listTags", () => {
  it("returns tags array from items", async () => {
    server.use(
      http.get("http://localhost:3000/api/organizers/tags", () =>
        HttpResponse.json({
          page: 1, per_page: 300, total: 1, total_pages: 1,
          items: [{ id: "1", name: "Weeknight", slug: "weeknight" }],
        }),
      ),
    );
    const tags = await listTags();
    expect(tags).toHaveLength(1);
    expect(tags[0]?.name).toBe("Weeknight");
  });
});

describe("listCategories", () => {
  it("returns categories array from items", async () => {
    server.use(
      http.get("http://localhost:3000/api/organizers/categories", () =>
        HttpResponse.json({
          page: 1, per_page: 300, total: 1, total_pages: 1,
          items: [{ id: "2", name: "Italian", slug: "italian" }],
        }),
      ),
    );
    const cats = await listCategories();
    expect(cats[0]?.name).toBe("Italian");
  });
});

describe("recipeImageUrl", () => {
  it("returns tiny URL by default", () => {
    expect(recipeImageUrl("abc-123")).toBe(
      "/api/media/recipes/abc-123/images/tiny-original.webp",
    );
  });

  it("returns original URL when requested", () => {
    expect(recipeImageUrl("abc-123", "original")).toBe(
      "/api/media/recipes/abc-123/images/original.webp",
    );
  });
});
