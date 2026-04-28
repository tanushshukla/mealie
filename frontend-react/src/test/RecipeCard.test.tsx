import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeCard } from "../components/recipe/RecipeCard";
import type { RecipeSummary } from "@api-client";

const recipe: RecipeSummary = {
  id: "1",
  name: "Lemon Pasta",
  slug: "lemon-pasta",
  totalTime: "25 min",
  rating: 4.5,
  tags: [{ id: "t1", name: "Weeknight", slug: "weeknight" }],
  recipeCategory: [{ id: "c1", name: "Pasta", slug: "pasta" }],
};

describe("RecipeCard", () => {
  it("renders recipe name", () => {
    render(<RecipeCard recipe={recipe} onOpen={vi.fn()} />);
    expect(screen.getByText("Lemon Pasta")).toBeInTheDocument();
  });

  it("calls onOpen when clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecipeCard recipe={recipe} onOpen={onOpen} />);
    await user.click(screen.getByText("Lemon Pasta"));
    expect(onOpen).toHaveBeenCalledWith(recipe);
  });

  it("renders in row layout", () => {
    const { container } = render(<RecipeCard recipe={recipe} onOpen={vi.fn()} layout="row" />);
    expect(container.firstChild).toHaveClass("rcard-row");
  });
});
