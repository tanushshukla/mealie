import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMealPlans, useCreateMealPlan, useDeleteMealPlan } from "../../../../hooks/usePlanner";
import { useInfiniteRecipes } from "../../../../hooks/useRecipes";
import { recipeImageUrl } from "@api-client";
import type { PlanEntryType, PlanEntry } from "@api-client";

export const Route = createFileRoute("/g/$groupSlug/planner/")({
  component: PlannerPage,
});

const SLOTS: { key: PlanEntryType; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "☀" },
  { key: "lunch", label: "Lunch", icon: "◐" },
  { key: "dinner", label: "Dinner", icon: "☾" },
];

function isoWeekStart(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtWeekday(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
}

interface PickerProps {
  date: string;
  slot: PlanEntryType;
  groupSlug: string;
  onCreate: (recipeId: string) => void;
  onClose: () => void;
}

function RecipePicker({ date, slot, onCreate, onClose }: PickerProps) {
  const [q, setQ] = useState("");
  const { data, isLoading } = useInfiniteRecipes({ search: q || undefined, perPage: 20 });
  const recipes = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="text-xs text-text-dim uppercase tracking-wider">{slot} · {fmtDate(date)}</div>
            <h3 className="font-serif text-lg text-text">Pick a recipe</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text">✕</button>
        </div>
        <div className="p-3 border-b border-border">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes…"
            className="w-full bg-bg-sunken border border-border rounded-full px-3.5 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-text-muted">Loading…</div>
          ) : recipes.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-muted">No recipes found</div>
          ) : recipes.map((r) => (
            <button
              key={r.id ?? r.slug}
              onClick={() => r.id && onCreate(r.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-bg-sunken transition-colors text-left"
            >
              {r.id ? (
                <img src={recipeImageUrl(r.id, "tiny")} alt="" className="w-12 h-12 rounded-lg object-cover bg-bg-muted shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-bg-muted shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-text truncate">{r.name}</div>
                <div className="text-xs text-text-muted">{r.totalTime ?? r.cookTime ?? ""}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const { groupSlug } = Route.useParams();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [picker, setPicker] = useState<{ date: string; slot: PlanEntryType } | null>(null);

  const weekStart = useMemo(() => isoWeekStart(weekOffset), [weekOffset]);
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return toISO(d);
    }),
    [weekStart],
  );

  const startDate = days[0]!;
  const endDate = days[6]!;

  const { data: entries = [], isLoading } = useMealPlans(startDate, endDate);
  const createEntry = useCreateMealPlan(startDate, endDate);
  const deleteEntry = useDeleteMealPlan(startDate, endDate);

  const today = toISO(new Date());

  const entryFor = (date: string, slot: PlanEntryType): PlanEntry | undefined =>
    entries.find((e) => e.date === date && e.entryType === slot);

  const weekLabel = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

  return (
    <div className="px-4 md:px-8 py-7 max-w-[1200px] mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Meal Planner</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-none tracking-tight">
            Week of <em className="italic font-normal text-brand">{weekLabel}</em>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
          >‹</button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3.5 py-2 text-sm border border-border rounded-full hover:bg-bg-elev"
            disabled={weekOffset === 0}
          >This week</button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
          >›</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            <div />
            {days.map((d) => (
              <div key={d} className={`text-center py-1 ${d === today ? "text-brand font-semibold" : "text-text-muted"}`}>
                <div className="text-[11px] uppercase tracking-wider">{fmtWeekday(d)}</div>
                <div className={`text-sm font-medium ${d === today ? "w-7 h-7 rounded-full bg-brand text-brand-fg mx-auto flex items-center justify-center" : ""}`}>
                  {new Date(d + "T00:00:00").getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Slot rows */}
          {SLOTS.map((slot) => (
            <div key={slot.key} className="grid gap-1 mb-1" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
              <div className="flex flex-col items-center justify-center py-2 text-text-dim">
                <span className="text-lg">{slot.icon}</span>
                <span className="text-[11px] capitalize">{slot.label}</span>
              </div>
              {days.map((d) => {
                const entry = entryFor(d, slot.key);
                return (
                  <div
                    key={d}
                    className={`min-h-[96px] rounded-xl border transition-colors ${
                      d === today ? "border-brand/30 bg-brand-soft/20" : "border-border bg-bg-elev"
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-full animate-pulse bg-bg-muted rounded-xl" />
                    ) : entry ? (
                      <div
                        className="h-full p-2 flex flex-col gap-1 cursor-pointer group relative"
                        onClick={() => entry.recipe?.slug && navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: entry.recipe.slug } })}
                      >
                        {entry.recipe?.id && (
                          <img
                            src={recipeImageUrl(entry.recipe.id, "tiny")}
                            alt=""
                            className="w-full aspect-[3/2] rounded-lg object-cover"
                          />
                        )}
                        <div className="text-[11px] font-medium text-text leading-tight line-clamp-2">
                          {entry.recipe?.name ?? entry.title}
                        </div>
                        {entry.recipe?.totalTime && (
                          <div className="text-[10px] text-text-dim">{entry.recipe.totalTime}</div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEntry.mutate(entry.id); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPicker({ date: d, slot: slot.key })}
                        className="h-full w-full flex items-center justify-center text-text-dim hover:text-brand hover:bg-brand-soft/30 rounded-xl transition-colors text-xl"
                      >+</button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {picker && (
        <RecipePicker
          date={picker.date}
          slot={picker.slot}
          groupSlug={groupSlug}
          onCreate={(recipeId) => {
            createEntry.mutate({ date: picker.date, entryType: picker.slot, recipeId });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
