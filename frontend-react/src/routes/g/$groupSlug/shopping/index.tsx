import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  useShoppingLists,
  useShoppingList,
  useToggleShoppingItem,
  useCreateShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
  useClearAllItems,
} from "../../../../hooks/usePlanner";

export const Route = createFileRoute("/g/$groupSlug/shopping/")({
  component: ShoppingPage,
});

function formatItem(item: import("@api-client").ShoppingListItem): string {
  if (item.display) return item.display;
  const parts: string[] = [];
  if (item.quantity != null && item.quantity !== 0) parts.push(String(item.quantity));
  if (item.unit) parts.push(item.unit.abbreviation ?? item.unit.name);
  if (item.food) parts.push(item.food.name);
  if (item.note) parts.push(item.note);
  return parts.join(" ") || "Item";
}

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

function AddItemForm({ listId }: { listId: string }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateShoppingItem(listId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    create.mutate(trimmed, {
      onSuccess: () => {
        setText("");
        inputRef.current?.focus();
      },
    });
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

function ShoppingPage() {
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

  // Group unchecked by label, then append checked at bottom
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

      {/* List tabs (if multiple lists) */}
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
        {/* Progress bar */}
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

        {/* Add item input */}
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
            {/* Unchecked items grouped by label */}
            {Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName}>
                {Object.keys(groups).length > 1 && (
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim bg-bg-sunken border-b border-border">
                    {groupName}
                  </div>
                )}
                {groupItems
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggle.mutate({ id: item.id, checked: !item.checked })}
                      onDelete={() => remove.mutate(item.id)}
                    />
                  ))}
              </div>
            ))}

            {/* Checked items */}
            {checked.length > 0 && (
              <div>
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim bg-bg-sunken border-t border-b border-border">
                  In the basket ({checkedCount})
                </div>
                {checked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
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
          onConfirm={() => {
            clearAll.mutate(items.map((i) => i.id), { onSuccess: () => setClearAllOpen(false) });
          }}
          onCancel={() => setClearAllOpen(false)}
          isPending={clearAll.isPending}
        />
      )}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: import("@api-client").ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-bg-sunken/50 group transition-colors">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked ? "bg-brand border-brand text-brand-fg" : "border-border hover:border-brand"
        }`}
      >
        {item.checked && <span className="text-[10px]">✓</span>}
      </button>
      <span
        className={`text-sm flex-1 leading-snug ${item.checked ? "line-through text-text-dim" : "text-text"}`}
      >
        {formatItem(item)}
      </span>
      <button
        onClick={onDelete}
        className="w-6 h-6 rounded-full flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/8 opacity-0 group-hover:opacity-100 transition-all text-xs shrink-0"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}
