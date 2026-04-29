import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useRecipe, useUpdateRecipe, useDeleteRecipe } from "../../../../../hooks/useRecipes";
import type { Recipe, RecipeTag, RecipeCategory } from "@api-client";

export const Route = createFileRoute("/g/$groupSlug/r/$slug/edit")({
  component: RecipeEditPage,
});

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-dim">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-colors";

const textareaCls = inputCls + " resize-none";

// ─── Editable list (ingredients / steps) ─────────────────────────────────────

function EditableList({
  items,
  onChange,
  placeholder,
  multiline = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const update = (i: number, val: string) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) =>
        multiline ? (
          <div key={i} className="flex gap-2 items-start">
            <span className="shrink-0 w-6 h-6 mt-2 rounded-full bg-brand-soft text-brand-ink text-xs font-medium flex items-center justify-center">
              {i + 1}
            </span>
            <textarea
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className={textareaCls + " flex-1"}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 mt-2 w-7 h-7 flex items-center justify-center rounded-full text-text-dim hover:text-danger hover:bg-danger/8 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <div key={i} className="flex gap-2 items-center">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand mt-0.5" />
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-dim hover:text-danger hover:bg-danger/8 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        ),
      )}
      <button
        type="button"
        onClick={add}
        className="self-start text-sm text-brand hover:text-brand-ink font-medium flex items-center gap-1.5 py-1"
      >
        <span className="w-5 h-5 rounded-full border border-brand flex items-center justify-center text-xs">+</span>
        Add {multiline ? "step" : "ingredient"}
      </button>
    </div>
  );
}

// ─── Tag / Category chip input ────────────────────────────────────────────────

function ChipInput<T extends { id?: string | null; name?: string | null }>({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function addItem() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (items.some((t) => t.name?.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...items, { name: trimmed } as T]);
    setInput("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg border border-border bg-bg focus-within:ring-2 focus-within:ring-brand/25 focus-within:border-brand transition-colors">
        {items.map((t, i) => (
          <span
            key={t.id ?? i}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-ink text-xs font-medium"
          >
            {t.name}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="hover:text-danger ml-0.5"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={items.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
        />
      </div>
      <p className="text-xs text-text-dim">Press Enter or comma to add</p>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  recipeName,
  onConfirm,
  onCancel,
  isPending,
}: {
  recipeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="font-serif text-xl text-text mb-1">Delete recipe?</h2>
          <p className="text-sm text-text-muted">
            <strong className="text-text">{recipeName}</strong> will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-bg-elev transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 rounded-full bg-danger text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit form (receives loaded recipe) ──────────────────────────────────────

function RecipeEditForm({ recipe, groupSlug }: { recipe: Recipe; groupSlug: string }) {
  const navigate = useNavigate();
  const update = useUpdateRecipe(recipe.slug ?? "");
  const del = useDeleteRecipe();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(recipe.name ?? "");
  const [description, setDescription] = useState(recipe.description ?? "");
  const [servings, setServings] = useState(String(recipe.recipeServings ?? ""));
  const [prepTime, setPrepTime] = useState(recipe.prepTime ?? "");
  const [cookTime, setCookTime] = useState(recipe.cookTime ?? "");
  const [totalTime, setTotalTime] = useState(recipe.totalTime ?? "");
  const [sourceUrl, setSourceUrl] = useState(recipe.orgURL ?? "");
  const [tags, setTags] = useState<RecipeTag[]>(recipe.tags ?? []);
  const [categories, setCategories] = useState<RecipeCategory[]>(recipe.recipeCategory ?? []);

  const [ingredients, setIngredients] = useState<string[]>(() => {
    const items = recipe.recipeIngredient ?? [];
    return items
      .filter((i) => !i.title)
      .map((i) => i.display ?? i.originalText ?? i.note ?? "")
      .filter(Boolean);
  });

  const [steps, setSteps] = useState<string[]>(() =>
    (recipe.recipeInstructions ?? []).filter((s) => !s.title).map((s) => s.text).filter(Boolean),
  );

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload: Partial<Recipe> = {
        ...recipe,
        name: name.trim() || recipe.name,
        description: description.trim() || undefined,
        recipeServings: servings ? Number(servings) : recipe.recipeServings,
        prepTime: prepTime.trim() || undefined,
        cookTime: cookTime.trim() || undefined,
        totalTime: totalTime.trim() || undefined,
        orgURL: sourceUrl.trim() || undefined,
        tags,
        recipeCategory: categories,
        recipeIngredient: ingredients
          .filter((s) => s.trim())
          .map((display) => ({ display: display.trim(), originalText: display.trim() })),
        recipeInstructions: steps
          .filter((s) => s.trim())
          .map((text) => ({ text: text.trim() })),
      };

      const updated = await update.mutateAsync(payload);
      const newSlug = updated.slug ?? recipe.slug ?? "";
      navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: newSlug } });
    },
    [recipe, name, description, servings, prepTime, cookTime, totalTime, sourceUrl, tags, categories, ingredients, steps, update, navigate, groupSlug],
  );

  const handleDelete = useCallback(async () => {
    await del.mutateAsync(recipe.slug ?? "");
    navigate({ to: "/g/$groupSlug", params: { groupSlug } });
  }, [del, recipe.slug, navigate, groupSlug]);

  return (
    <form onSubmit={handleSave} className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-text-dim">
          <Link to="/g/$groupSlug/r/$slug" params={{ groupSlug, slug: recipe.slug ?? "" }} className="hover:text-text">
            ← Back to recipe
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger/8 rounded-full transition-colors"
          >
            Delete
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="px-5 py-2 rounded-full bg-brand text-brand-fg text-sm font-medium hover:bg-brand-ink transition-colors disabled:opacity-50"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <h1 className="font-serif text-3xl text-text -mb-4">Edit recipe</h1>

      {update.isError && (
        <p className="text-sm text-danger bg-danger/8 rounded-lg px-4 py-2.5">
          Failed to save. Please try again.
        </p>
      )}

      {/* Basic info */}
      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-lg text-text border-b border-border pb-2">Basic info</h2>
        <Field label="Name">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={textareaCls} placeholder="A short description of the dish…" />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Servings">
            <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} className={inputCls} placeholder="4" />
          </Field>
          <Field label="Prep time">
            <input type="text" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className={inputCls} placeholder="15 min" />
          </Field>
          <Field label="Cook time">
            <input type="text" value={cookTime} onChange={(e) => setCookTime(e.target.value)} className={inputCls} placeholder="30 min" />
          </Field>
          <Field label="Total time">
            <input type="text" value={totalTime} onChange={(e) => setTotalTime(e.target.value)} className={inputCls} placeholder="45 min" />
          </Field>
        </div>
        <Field label="Source URL">
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputCls} placeholder="https://example.com/recipe" />
        </Field>
      </section>

      {/* Organizers */}
      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-lg text-text border-b border-border pb-2">Organizers</h2>
        <ChipInput label="Tags" items={tags} onChange={setTags} placeholder="Add a tag…" />
        <ChipInput label="Categories" items={categories} onChange={setCategories} placeholder="Add a category…" />
      </section>

      {/* Ingredients */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg text-text border-b border-border pb-2">
          Ingredients
          <span className="ml-2 text-sm font-sans font-normal text-text-dim">{ingredients.length}</span>
        </h2>
        <EditableList
          items={ingredients}
          onChange={setIngredients}
          placeholder="e.g. 2 cups flour"
        />
      </section>

      {/* Instructions */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg text-text border-b border-border pb-2">
          Instructions
          <span className="ml-2 text-sm font-sans font-normal text-text-dim">{steps.length} steps</span>
        </h2>
        <EditableList
          items={steps}
          onChange={setSteps}
          placeholder="Describe this step…"
          multiline
        />
      </section>

      {/* Save footer */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Link
          to="/g/$groupSlug/r/$slug"
          params={{ groupSlug, slug: recipe.slug ?? "" }}
          className="px-5 py-2 rounded-full border border-border text-sm font-medium hover:bg-bg-elev transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={update.isPending}
          className="px-5 py-2 rounded-full bg-brand text-brand-fg text-sm font-medium hover:bg-brand-ink transition-colors disabled:opacity-50"
        >
          {update.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      {deleteOpen && (
        <DeleteConfirm
          recipeName={recipe.name ?? "this recipe"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
          isPending={del.isPending}
        />
      )}
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RecipeEditPage() {
  const { groupSlug, slug } = Route.useParams();
  const { data: recipe, isLoading, isError } = useRecipe(slug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-muted">
        Loading…
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

  return <RecipeEditForm recipe={recipe} groupSlug={groupSlug} />;
}
