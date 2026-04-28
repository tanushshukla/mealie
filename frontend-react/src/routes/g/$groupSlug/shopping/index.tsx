import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useShoppingLists, useShoppingList, useToggleShoppingItem } from "../../../../hooks/usePlanner";

export const Route = createFileRoute("/g/$groupSlug/shopping/")({
  component: ShoppingPage,
});

function formatItem(item: import("@api-client").ShoppingListItem): string {
  if (item.display) return item.display;
  const parts: string[] = [];
  if (item.quantity != null && item.quantity !== 0) parts.push(String(item.quantity));
  if (item.unit) parts.push(item.unit.abbreviation ?? item.unit.name);
  if (item.food) parts.push(item.food.name);
  if (item.note) parts.push(`— ${item.note}`);
  return parts.join(" ") || "Item";
}

function ShoppingPage() {
  const { data: lists = [], isLoading: listsLoading } = useShoppingLists();
  const [activeId, setActiveId] = useState<string>("");
  const resolvedId = activeId || lists[0]?.id || "";

  const { data: list, isLoading: listLoading } = useShoppingList(resolvedId);
  const toggle = useToggleShoppingItem(resolvedId);

  const items = list?.listItems ?? [];
  const checked = items.filter((i) => i.checked).length;

  // Group by label
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
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
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Shopping List</div>
        <h1 className="font-serif text-4xl leading-none tracking-tight">
          <em className="italic font-normal text-brand">{items.length - checked}</em> things to grab
        </h1>
      </div>

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

      {items.length > 0 && (
        <div className="bg-bg-elev border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm text-text-muted tabular-nums">
              <strong className="text-text">{checked}</strong> / {items.length}
            </span>
          </div>

          {listLoading ? (
            <div className="p-6 text-center text-sm text-text-muted">Loading items…</div>
          ) : (
            Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim bg-bg-sunken border-b border-border">
                  {groupName}
                </div>
                {groupItems
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggle.mutate({ id: item.id, checked: !item.checked })}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-bg-sunken transition-colors text-left"
                    >
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.checked ? "bg-brand border-brand text-brand-fg" : "border-border"
                      }`}>
                        {item.checked && <span className="text-[10px]">✓</span>}
                      </span>
                      <span className={`text-sm flex-1 ${item.checked ? "line-through text-text-dim" : "text-text"}`}>
                        {formatItem(item)}
                      </span>
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
