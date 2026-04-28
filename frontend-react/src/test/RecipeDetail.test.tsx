import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IngredientsList } from "../components/recipe/IngredientsList";
import { NutritionPanel } from "../components/recipe/NutritionPanel";
import { StepList } from "../components/recipe/StepList";
import { RecipeHero } from "../components/recipe/RecipeHero";
import type { Recipe, RecipeIngredient, RecipeStep, Nutrition } from "@api-client";

const baseRecipe: Recipe = {
  id: "recipe-1",
  name: "Pasta Carbonara",
  description: "Classic Roman pasta dish.",
  recipeServings: 4,
  totalTime: "30 minutes",
  rating: 4.5,
  recipeCategory: [{ id: "cat-1", name: "Italian", slug: "italian" }],
  tags: [{ id: "tag-1", name: "Quick", slug: "quick" }],
};

describe("RecipeHero", () => {
  it("renders recipe name", () => {
    render(<RecipeHero recipe={baseRecipe} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pasta Carbonara");
  });

  it("renders description", () => {
    render(<RecipeHero recipe={baseRecipe} />);
    expect(screen.getByText("Classic Roman pasta dish.")).toBeInTheDocument();
  });

  it("renders category and tag chips", () => {
    render(<RecipeHero recipe={baseRecipe} />);
    expect(screen.getByText("Italian")).toBeInTheDocument();
    expect(screen.getByText("Quick")).toBeInTheDocument();
  });

  it("renders time and servings metadata", () => {
    render(<RecipeHero recipe={baseRecipe} />);
    expect(screen.getByText("30 minutes")).toBeInTheDocument();
    expect(screen.getByText("4 servings")).toBeInTheDocument();
  });

  it("renders original source link when orgURL provided", () => {
    render(<RecipeHero recipe={{ ...baseRecipe, orgURL: "https://example.com/recipe" }} />);
    expect(screen.getByRole("link", { name: /original source/i })).toHaveAttribute(
      "href",
      "https://example.com/recipe",
    );
  });

  it("renders placeholder when no id", () => {
    const { container } = render(<RecipeHero recipe={{ ...baseRecipe, id: undefined }} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("IngredientsList", () => {
  const ingredients: RecipeIngredient[] = [
    { quantity: 200, unit: { name: "grams", abbreviation: "g" }, food: { name: "spaghetti" } },
    { quantity: 2, food: { name: "eggs" } },
    { display: "Salt to taste" },
  ];

  it("renders heading", () => {
    render(<IngredientsList ingredients={ingredients} />);
    expect(screen.getByRole("heading", { name: /ingredients/i })).toBeInTheDocument();
  });

  it("renders ingredients from display field", () => {
    render(<IngredientsList ingredients={ingredients} />);
    expect(screen.getByText("Salt to taste")).toBeInTheDocument();
  });

  it("renders ingredient with quantity and unit", () => {
    render(<IngredientsList ingredients={ingredients} />);
    expect(screen.getByText("200 g spaghetti")).toBeInTheDocument();
  });

  it("renders section header for title ingredients", () => {
    const withTitle: RecipeIngredient[] = [
      { title: "For the sauce" },
      { food: { name: "butter" } },
    ];
    render(<IngredientsList ingredients={withTitle} />);
    expect(screen.getByText("For the sauce")).toBeInTheDocument();
    expect(screen.getByText("butter")).toBeInTheDocument();
  });

  it("returns null for empty list", () => {
    const { container } = render(<IngredientsList ingredients={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("NutritionPanel", () => {
  const nutrition: Nutrition = {
    calories: "450 kcal",
    proteinContent: "22g",
    fatContent: "18g",
    carbohydrateContent: "52g",
  };

  it("renders heading", () => {
    render(<NutritionPanel nutrition={nutrition} />);
    expect(screen.getByRole("heading", { name: /nutrition/i })).toBeInTheDocument();
  });

  it("renders visible nutrition rows", () => {
    render(<NutritionPanel nutrition={nutrition} />);
    expect(screen.getByText("Calories")).toBeInTheDocument();
    expect(screen.getByText("450 kcal")).toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("22g")).toBeInTheDocument();
  });

  it("hides rows with null values", () => {
    render(<NutritionPanel nutrition={{ calories: "100 kcal" }} />);
    expect(screen.queryByText("Protein")).toBeNull();
    expect(screen.queryByText("Fat")).toBeNull();
  });

  it("returns null when all values are empty", () => {
    const { container } = render(<NutritionPanel nutrition={{}} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("StepList", () => {
  const steps: RecipeStep[] = [
    { text: "Boil the water." },
    { text: "Cook the pasta." },
    { text: "Mix with sauce." },
  ];

  it("renders heading", () => {
    render(<StepList steps={steps} />);
    expect(screen.getByRole("heading", { name: /instructions/i })).toBeInTheDocument();
  });

  it("renders step numbers and text", () => {
    render(<StepList steps={steps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Boil the water.")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Mix with sauce.")).toBeInTheDocument();
  });

  it("renders section title", () => {
    const withTitle: RecipeStep[] = [
      { id: "s1", title: "Prep", text: "" },
      { id: "s2", text: "Chop the onions." },
    ];
    render(<StepList steps={withTitle} />);
    expect(screen.getByText("Prep")).toBeInTheDocument();
    expect(screen.getByText("Chop the onions.")).toBeInTheDocument();
  });

  it("returns null for empty steps", () => {
    const { container } = render(<StepList steps={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
