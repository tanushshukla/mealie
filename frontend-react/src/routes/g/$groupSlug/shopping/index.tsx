import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  useShoppingLists,
  useShoppingList,
  useToggleShoppingItem,
  useCreateShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
  useClearAllItems,
} from "../../../../hooks/usePlanner";
import { recipeImageUrl } from "@api-client";
import type { ShoppingListItem, ShoppingListRecipeRef } from "@api-client";

export const Route = createFileRoute("/g/$groupSlug/shopping/")({
  component: ShoppingPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatItem(item: ShoppingListItem): string {
  if (item.display) return item.display;
  const parts: string[] = [];
  if (item.quantity != null && item.quantity !== 0) parts.push(String(item.quantity));
  if (item.unit) parts.push(item.unit.abbreviation ?? item.unit.name);
  if (item.food) parts.push(item.food.name);
  if (item.note) parts.push(item.note);
  return parts.join(" ") || "Item";
}

function recipeNamesForItem(
  item: ShoppingListItem,
  recipeMap: Map<string, ShoppingListRecipeRef>,
): string {
  const names = (item.recipeReferences ?? [])
    .map((r) => recipeMap.get(r.recipeId)?.recipe.name)
    .filter(Boolean) as string[];
  if (names.length === 0) return "";
  if (names.length <= 2) return `for ${names.join(" & ")}`;
  return `for ${names[0]} +${names.length - 1} more`;
}

// ─── Recipe popover ───────────────────────────────────────────────────────────

function RecipePopover({
  refs,
  recipeMap,
  groupSlug,
  onClose,
  anchorRef,
}: {
  refs: import("@api-client").ShoppingListItemRecipeRef[];
  recipeMap: Map<string, ShoppingListRecipeRef>;
  groupSlug: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const navigate = useNavigate();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [onClose, anchorRef]);

  const recipes = refs.map((r) => recipeMap.get(r.recipeId)).filter(Boolean) as ShoppingListRecipeRef[];

  return (
    <div
      ref={popRef}
      className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg w-64 overflow-hidden"
    >
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-dim border-b border-border">
        Used in
      </div>
      {recipes.map((ref) => (
        <button
          key={ref.recipeId}
          onClick={() => {
            navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: ref.recipe.slug ?? "" } });
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-elev transition-colors text-left"
        >
          {ref.recipe.id ? (
            <img
              src={recipeImageUrl(ref.recipe.id, "tiny")}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-bg-muted"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-bg-muted shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text truncate">{ref.recipe.name}</div>
            {ref.recipe.totalTime && (
              <div className="text-xs text-text-muted">{ref.recipe.totalTime}</div>
            )}
          </div>
          <span className="text-text-dim text-xs">›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Clear-all confirm ────────────────────────────────────────────────────────

function ClearAllConfirm({
  itemCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="font-serif text-xl text-text mb-1">Clear all items?</h2>
          <p className="text-sm text-text-muted">
            All <strong className="text-text">{itemCount}</strong> items will be permanently removed. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-bg-elev transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 rounded-full bg-danger text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? "Clearing…" : "Clear all"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add-item form ────────────────────────────────────────────────────────────

function AddItemForm({ listId }: { listId: string }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateShoppingItem(listId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    create.mutate(trimmed, { onSuccess: () => { setText(""); inputRef.current?.focus(); } });
  }

  return (
    <form onSubmit={submit} className="flex gap-2 px-4 py-3 border-b border-border">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add an item…"
        className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
        disabled={create.isPending}
      />
      <button
        type="submit"
        disabled={!text.trim() || create.isPending}
        className="text-sm font-medium text-brand hover:text-brand-ink disabled:opacity-40 shrink-0 transition-colors"
      >
        {create.isPending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  recipeMap,
  groupSlug,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem;
  recipeMap: Map<string, ShoppingListRecipeRef>;
  groupSlug: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const arrowRef = useRef<HTMLButtonElement>(null);

  const refs = item.recipeReferences ?? [];
  const linkedRecipes = refs.map((r) => recipeMap.get(r.recipeId)).filter(Boolean) as ShoppingListRecipeRef[];
  const recipeSub = recipeNamesForItem(item, recipeMap);

  function handleArrow() {
    if (linkedRecipes.length === 1) {
      navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: linkedRecipes[0]!.recipe.slug ?? "" } });
    } else {
      setPopoverOpen((o) => !o);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-bg-sunken/50 group transition-colors relative">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked ? "bg-brand border-brand text-brand-fg" : "border-border hover:border-brand"
        }`}
      >
        {item.checked && <span className="text-[10px]">✓</span>}
      </button>

      {/* Label + recipe attribution */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm leading-snug ${item.checked ? "line-through text-text-dim" : "text-text"}`}>
          {formatItem(item)}
        </span>
        {recipeSub && (
          <div className="text-xs text-text-muted mt-0.5 truncate">{recipeSub}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/8 opacity-0 group-hover:opacity-100 transition-all text-xs"
          title="Remove"
        >
          ✕
        </button>
        {linkedRecipes.length > 0 && (
          <button
            ref={arrowRef}
            onClick={handleArrow}
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-elev hover:text-brand transition-colors text-sm"
            title={linkedRecipes.length === 1 ? `Go to ${linkedRecipes[0]!.recipe.name}` : "View recipes"}
          >
            ›
          </button>
        )}
      </div>

      {/* Multi-recipe popover */}
      {popoverOpen && linkedRecipes.length > 1 && (
        <RecipePopover
          refs={refs}
          recipeMap={recipeMap}
          groupSlug={groupSlug}
          onClose={() => setPopoverOpen(false)}
          anchorRef={arrowRef}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ShoppingPage() {
  const { groupSlug } = Route.useParams();
  const { data: lists = [], isLoading: listsLoading } = useShoppingLists();
  const [activeId, setActiveId] = useState<string>("");
  const resolvedId = activeId || lists[0]?.id || "";

  const { data: list, isLoading: listLoading } = useShoppingList(resolvedId);
  const toggle = useToggleShoppingItem(resolvedId);
  const remove = useDeleteShoppingItem(resolvedId);
  const clearChecked = useClearCheckedItems(resolvedId);
  const clearAll = useClearAllItems(resolvedId);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const items = list?.listItems ?? [];
  const checked = items.filter((i) => i.checked);
  const unchecked = items.filter((i) => !i.checked);
  const checkedCount = checked.length;

  // Build recipeId → ShoppingListRecipeRef map from the list-level recipe_references
  const recipeMap = new Map<string, ShoppingListRecipeRef>();
  for (const ref of list?.recipeReferences ?? []) {
    recipeMap.set(ref.recipeId, ref);
  }

  const groups = unchecked.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.label?.name ?? "Other";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  if (listsLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-text-muted">Loading…</div>;
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-text-muted">
        <p>No shopping lists yet.</p>
        <p className="text-sm">Add a recipe to your meal plan to generate one.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-7 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Shopping</div>
          <h1 className="font-serif text-4xl leading-none tracking-tight">
            <em className="italic font-normal text-brand">{unchecked.length}</em>{" "}
            {unchecked.length === 1 ? "item" : "items"} to grab
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {checkedCount > 0 && (
            <button
              onClick={() => clearChecked.mutate(checked.map((i) => i.id))}
              disabled={clearChecked.isPending}
              className="text-sm text-text-muted hover:text-brand transition-colors disabled:opacity-40"
            >
              {clearChecked.isPending ? "Clearing…" : `Clear ${checkedCount} checked`}
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={() => setClearAllOpen(true)}
              className="text-sm text-text-muted hover:text-danger transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* List tabs */}
      {lists.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                (activeId || lists[0]?.id) === l.id
                  ? "bg-text text-bg border-text"
                  : "border-border text-text-muted hover:border-text"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* List body */}
      <div className="bg-bg-elev border border-border rounded-xl overflow-hidden">
        {items.length > 0 && (
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm text-text-muted tabular-nums">
              <strong className="text-text">{checkedCount}</strong> / {items.length}
            </span>
          </div>
        )}

        {resolvedId && <AddItemForm listId={resolvedId} />}

        {listLoading ? (
          <div className="p-6 text-center text-sm text-text-muted">Loading items…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">
            <div className="text-3xl mb-2">🛒</div>
            <p>Your list is empty.</p>
            <p className="mt-1 text-xs">Add items above or import from a recipe.</p>
          </div>
        ) : (
          <>
            {Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName}>
                {Object.keys(groups).length > 1 && (
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim bg-bg-sunken border-b border-border flex items-center justify-between">
                    <span>{groupName}</span>
                    <span className="font-normal">{groupItems.length} left</span>
                  </div>
                )}
                {groupItems
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      recipeMap={recipeMap}
                      groupSlug={groupSlug}
                      onToggle={() => toggle.mutate({ id: item.id, checked: !item.checked })}
                      onDelete={() => remove.mutate(item.id)}
                    />
                  ))}
              </div>
            ))}

            {checked.length > 0 && (
              <div>
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim bg-bg-sunken border-t border-b border-border">
                  In the basket ({checkedCount})
                </div>
                {checked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    recipeMap={recipeMap}
                    groupSlug={groupSlug}
                    onToggle={() => toggle.mutate({ id: item.id, checked: false })}
                    onDelete={() => remove.mutate(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {clearAllOpen && (
        <ClearAllConfirm
          itemCount={items.length}
          onConfirm={() => clearAll.mutate(items.map((i) => i.id), { onSuccess: () => setClearAllOpen(false) })}
          onCancel={() => setClearAllOpen(false)}
          isPending={clearAll.isPending}
        />
      )}
    </div>
  );
}
