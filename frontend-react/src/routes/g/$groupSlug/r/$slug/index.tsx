import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRecipe } from "../../../../../hooks/useRecipes";
import {
  useAddToMealPlan,
  useAddRecipeToShoppingList,
  useShoppingLists,
  useCreateShoppingList,
} from "../../../../../hooks/usePlanner";
import { RecipeHero } from "../../../../../components/recipe/RecipeHero";
import { IngredientsList } from "../../../../../components/recipe/IngredientsList";
import { NutritionPanel } from "../../../../../components/recipe/NutritionPanel";
import { StepList } from "../../../../../components/recipe/StepList";
import type { Recipe } from "@api-client";
import type { PlanEntryType } from "@api-client";

export const Route = createFileRoute("/g/$groupSlug/r/$slug/")({
  component: RecipeDetailPage,
});

const MEAL_TYPES: { value: PlanEntryType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "side", label: "Side" },
  { value: "snack", label: "Snack" },
  { value: "drink", label: "Drink" },
  { value: "dessert", label: "Dessert" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function AddToPlanModal({
  recipeId,
  onClose,
}: {
  recipeId: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState(todayISO);
  const [mealType, setMealType] = useState<PlanEntryType>("dinner");
  const addToMealPlan = useAddToMealPlan();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addToMealPlan.mutateAsync({ date, entryType: mealType, recipeId });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text">Add to meal plan</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-lg">✕</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">Meal</label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setMealType(mt.value)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mealType === mt.value
                    ? "bg-brand text-brand-fg"
                    : "bg-bg-elev text-text-muted hover:text-text border border-border"
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={addToMealPlan.isPending}
          className="w-full py-2.5 rounded-full bg-brand text-brand-fg text-sm font-medium hover:bg-brand-ink transition-colors disabled:opacity-50"
        >
          {addToMealPlan.isPending ? "Adding…" : "Add to plan"}
        </button>

        {addToMealPlan.isError && (
          <p className="text-xs text-danger text-center">Failed to add. Please try again.</p>
        )}
      </form>
    </div>
  );
}

function thisWeekLabel(): string {
  const d = new Date();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function AddToShoppingModal({
  recipeId,
  onClose,
}: {
  recipeId: string;
  onClose: () => void;
}) {
  const { data: lists = [], isLoading } = useShoppingLists();
  const addToList = useAddRecipeToShoppingList();
  const createList = useCreateShoppingList();

  const weekLabel = thisWeekLabel();
  const weekNameTaken = lists.some((l) => l.name === weekLabel);
  const [newName, setNewName] = useState(() => weekNameTaken ? "" : weekLabel);
  const [showNewForm, setShowNewForm] = useState(lists.length === 0);

  async function handleAdd(listId: string) {
    await addToList.mutateAsync({ listId, recipeId });
    onClose();
  }

  async function handleCreateAndAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const list = await createList.mutateAsync(name);
    await addToList.mutateAsync({ listId: list.id, recipeId });
    onClose();
  }

  const isBusy = addToList.isPending || createList.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text">Add to shopping list</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-lg">✕</button>
        </div>

        {isLoading ? (
          <p className="text-sm text-text-muted text-center py-4">Loading lists…</p>
        ) : (
          <>
            {lists.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {lists.map((list) => (
                  <li key={list.id}>
                    <button
                      onClick={() => handleAdd(list.id)}
                      disabled={isBusy}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border bg-bg-elev hover:border-brand hover:bg-brand-soft text-sm font-medium text-text transition-colors disabled:opacity-50"
                    >
                      {list.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* New list section */}
            {showNewForm ? (
              <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="List name…"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-colors"
                />
                <div className="flex gap-2">
                  {lists.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="flex-1 py-2 rounded-full border border-border text-sm font-medium hover:bg-bg-elev transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isBusy || !newName.trim()}
                    className="flex-1 py-2 rounded-full bg-brand text-brand-fg text-sm font-medium hover:bg-brand-ink transition-colors disabled:opacity-50"
                  >
                    {isBusy ? "Creating…" : "Create & add"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-text-muted hover:border-brand hover:text-brand transition-colors"
              >
                <span className="text-base leading-none">+</span>
                New list
              </button>
            )}
          </>
        )}

        {(addToList.isError || createList.isError) && (
          <p className="text-xs text-danger text-center">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  );
}

function RecipeContent({ recipe, groupSlug }: { recipe: Recipe; groupSlug: string }) {
  const [detailTab, setDetailTab] = useState<"ingredients" | "nutrition">("ingredients");
  const [servings, setServings] = useState(recipe.recipeServings ?? 1);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false);

  const baseServings = recipe.recipeServings ?? 1;
  const scaleFactor = servings / baseServings;
  const ingredients = recipe.recipeIngredient ?? [];
  const steps = recipe.recipeInstructions ?? [];
  const hasNutrition = !!recipe.nutrition && Object.values(recipe.nutrition).some((v) => v != null && v !== "");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-dim">
        <Link to="/g/$groupSlug" params={{ groupSlug }} className="hover:text-text">
          Recipes
        </Link>
        <span>›</span>
        <span className="text-text truncate">{recipe.name}</span>
      </nav>

      <RecipeHero recipe={recipe} />

      {recipe.id && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPlanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-bg-elev text-sm font-medium text-text hover:border-brand hover:bg-brand-soft hover:text-brand-ink transition-colors"
          >
            <span>📅</span>
            <span>Add to meal plan</span>
          </button>
          <button
            onClick={() => setShoppingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-bg-elev text-sm font-medium text-text hover:border-brand hover:bg-brand-soft hover:text-brand-ink transition-colors"
          >
            <span>🛒</span>
            <span>Add to shopping list</span>
          </button>
          <Link
            to="/g/$groupSlug/r/$slug/edit"
            params={{ groupSlug, slug: recipe.slug ?? "" }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-bg-elev text-sm font-medium text-text hover:border-brand hover:bg-brand-soft hover:text-brand-ink transition-colors"
          >
            <span>✏️</span>
            <span>Edit</span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start gap-6">
        <div className="bg-surface rounded-lg border border-border">
          <div className="flex border-b border-border">
            <button
              onClick={() => setDetailTab("ingredients")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                detailTab === "ingredients"
                  ? "text-text border-b-2 border-brand -mb-px"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Ingredients
            </button>
            {hasNutrition && (
              <button
                onClick={() => setDetailTab("nutrition")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  detailTab === "nutrition"
                    ? "text-text border-b-2 border-brand -mb-px"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Nutrition
              </button>
            )}
          </div>

          {detailTab === "ingredients" && recipe.recipeServings != null && (
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Servings</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-7 h-7 rounded-full border border-border bg-bg-elev flex items-center justify-center text-text hover:border-brand hover:text-brand transition-colors text-base leading-none"
                  aria-label="Decrease servings"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-text tabular-nums">{servings}</span>
                <button
                  onClick={() => setServings((s) => s + 1)}
                  className="w-7 h-7 rounded-full border border-border bg-bg-elev flex items-center justify-center text-text hover:border-brand hover:text-brand transition-colors text-base leading-none"
                  aria-label="Increase servings"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="p-5">
            {detailTab === "ingredients" ? (
              <IngredientsList ingredients={ingredients} bare scaleFactor={scaleFactor} />
            ) : (
              recipe.nutrition && <NutritionPanel nutrition={recipe.nutrition} bare />
            )}
          </div>
        </div>

        <StepList steps={steps} />
      </div>

      {recipe.notes && recipe.notes.length > 0 && (
        <div className="bg-bg-sunken rounded-lg border border-border p-5 flex flex-col gap-3">
          <h2 className="font-serif text-xl text-text">Notes</h2>
          {recipe.notes.map((note, i) => (
            <div key={i} className="flex flex-col gap-1">
              {note.title && <h3 className="text-sm font-semibold text-text">{note.title}</h3>}
              <p className="text-sm text-text-muted leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}

      {planModalOpen && recipe.id && (
        <AddToPlanModal recipeId={recipe.id} onClose={() => setPlanModalOpen(false)} />
      )}
      {shoppingModalOpen && recipe.id && (
        <AddToShoppingModal recipeId={recipe.id} onClose={() => setShoppingModalOpen(false)} />
      )}
    </div>
  );
}

function RecipeDetailPage() {
  const { groupSlug, slug } = Route.useParams();
  const { data: recipe, isLoading, isError } = useRecipe(slug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-muted">
        Loading recipe…
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-text-muted">
        <p>Recipe not found.</p>
        <Link to="/g/$groupSlug" params={{ groupSlug }} className="text-sm text-brand hover:underline">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  return <RecipeContent recipe={recipe} groupSlug={groupSlug} />;
}
