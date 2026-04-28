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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isoWeekStart(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthBounds(offset: number): [string, string, number, number] {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  return [
    toISO(new Date(year, month, 1)),
    toISO(new Date(year, month + 1, 0)),
    year,
    month,
  ];
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtWeekday(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
}

function fmtMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ─── Recipe Picker ───────────────────────────────────────────────────────────

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

// ─── Calendar (month) view ────────────────────────────────────────────────────

function CalendarView({
  groupSlug,
  monthOffset,
  onMonthChange,
}: {
  groupSlug: string;
  monthOffset: number;
  onMonthChange: (o: number) => void;
}) {
  const navigate = useNavigate();
  const [monthStart, monthEnd, year, month] = useMemo(() => getMonthBounds(monthOffset), [monthOffset]);
  const { data: entries = [], isLoading } = useMealPlans(monthStart, monthEnd);

  const today = toISO(new Date());

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon … 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayMap = useMemo(() => {
    const map = new Map<string, PlanEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [entries]);

  function dayISO(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function mainEntry(iso: string): PlanEntry | undefined {
    const es = dayMap.get(iso) ?? [];
    return es.find((e) => e.entryType === "dinner") ?? es[0];
  }

  // Stats
  const pastEntries = entries.filter((e) => e.date < today);
  const futureEntries = entries.filter((e) => e.date >= today);
  const cookedNights = new Set(pastEntries.map((e) => e.date)).size;

  const recipeCounts = new Map<string, { count: number; name: string }>();
  for (const e of pastEntries) {
    if (e.recipeId && e.recipe?.name) {
      const c = recipeCounts.get(e.recipeId) ?? { count: 0, name: e.recipe.name };
      recipeCounts.set(e.recipeId, { count: c.count + 1, name: c.name });
    }
  }
  const topRecipe = [...recipeCounts.values()].reduce(
    (best, c) => (c.count > best.count ? c : best),
    { count: 0, name: "" },
  );

  const daysElapsed =
    monthOffset < 0 ? daysInMonth : monthOffset > 0 ? 0 : new Date().getDate();

  return (
    <div className="flex flex-col gap-5">
      {/* Month nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMonthChange(monthOffset - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
        >‹</button>
        <span className="font-serif text-xl text-text min-w-[180px] text-center">
          {fmtMonthYear(year, month)}
        </span>
        <button
          onClick={() => onMonthChange(monthOffset + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
        >›</button>
        {monthOffset !== 0 && (
          <button
            onClick={() => onMonthChange(0)}
            className="ml-1 px-3 py-1.5 text-sm border border-border rounded-full hover:bg-bg-elev"
          >Today</button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent inline-block" /> Cooked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand inline-block" /> Planned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand inline-block ring-2 ring-brand/30" /> Today
        </span>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-text-dim">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={"empty-" + i} className="min-h-[88px] border-b border-r border-border bg-bg-sunken/40" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const iso = dayISO(dayNum);
            const entry = mainEntry(iso);
            const isPast = iso < today;
            const isToday = iso === today;
            const colEnd = (firstWeekday + i) % 7 === 6; // last col = no right border

            return (
              <div
                key={dayNum}
                className={`min-h-[88px] p-2 border-b border-border relative transition-colors ${
                  colEnd ? "" : "border-r"
                } ${
                  entry?.recipe?.slug ? "cursor-pointer hover:bg-bg-elev" : ""
                } ${isToday ? "bg-brand-soft/25" : "bg-surface"}`}
                onClick={() =>
                  entry?.recipe?.slug &&
                  navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: entry.recipe!.slug! } })
                }
              >
                {/* Day number */}
                <div
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday
                      ? "bg-brand text-brand-fg font-semibold"
                      : isPast
                      ? "text-text-muted"
                      : "text-text"
                  }`}
                >
                  {dayNum}
                </div>

                {/* Recipe thumbnail */}
                {entry?.recipe?.id ? (
                  <>
                    <img
                      src={recipeImageUrl(entry.recipe.id, "tiny")}
                      alt=""
                      className="w-full aspect-video object-cover rounded-md mb-1"
                    />
                    <div className="text-[10px] font-medium text-text line-clamp-2 leading-tight">
                      {entry.recipe.name}
                    </div>
                  </>
                ) : isLoading ? (
                  <div className="w-full aspect-video rounded-md bg-bg-muted animate-pulse" />
                ) : null}

                {/* State dot */}
                {entry && (
                  <div
                    className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                      isPast ? "bg-accent" : "bg-brand"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
          <div className="text-xs text-text-dim uppercase tracking-wider">This month</div>
          <div className="text-2xl font-serif text-text">
            {cookedNights} <span className="text-base font-sans text-text-muted font-normal">nights cooked</span>
          </div>
          {daysElapsed > 0 && (
            <div className="text-xs text-text-dim">Out of {daysElapsed} days so far</div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
          <div className="text-xs text-text-dim uppercase tracking-wider">Most cooked</div>
          {topRecipe.count > 0 ? (
            <>
              <div className="text-2xl font-serif text-text">
                {topRecipe.count}× <span className="text-base font-sans text-text-muted font-normal">{topRecipe.name}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-text-muted">No data yet</div>
          )}
        </div>

        <div className="bg-brand-soft rounded-xl border border-brand/20 p-4 flex flex-col gap-1">
          <div className="text-xs text-brand-ink/70 uppercase tracking-wider">Coming up</div>
          <div className="text-2xl font-serif text-brand-ink">
            {futureEntries.length} <span className="text-base font-sans font-normal">{futureEntries.length === 1 ? "meal" : "meals"} planned</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({
  groupSlug,
  weekOffset,
  onWeekChange,
}: {
  groupSlug: string;
  weekOffset: number;
  onWeekChange: (o: number) => void;
}) {
  const navigate = useNavigate();
  const [picker, setPicker] = useState<{ date: string; slot: PlanEntryType } | null>(null);

  const weekStart = useMemo(() => isoWeekStart(weekOffset), [weekOffset]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return toISO(d);
      }),
    [weekStart],
  );

  const startDate = days[0]!;
  const endDate = days[6]!;
  const today = toISO(new Date());
  const weekLabel = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

  const { data: entries = [], isLoading } = useMealPlans(startDate, endDate);
  const createEntry = useCreateMealPlan(startDate, endDate);
  const deleteEntry = useDeleteMealPlan(startDate, endDate);

  const entryFor = (date: string, slot: PlanEntryType): PlanEntry | undefined =>
    entries.find((e) => e.date === date && e.entryType === slot);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onWeekChange(weekOffset - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
        >‹</button>
        <span className="font-serif text-xl text-text min-w-[200px] text-center">{weekLabel}</span>
        <button
          onClick={() => onWeekChange(weekOffset + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-elev text-text-muted"
        >›</button>
        <button
          onClick={() => onWeekChange(0)}
          disabled={weekOffset === 0}
          className="px-3.5 py-1.5 text-sm border border-border rounded-full hover:bg-bg-elev disabled:opacity-40"
        >This week</button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
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
                        onClick={() =>
                          entry.recipe?.slug &&
                          navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: entry.recipe!.slug! } })
                        }
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const { groupSlug } = Route.useParams();
  const [view, setView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  return (
    <div className="px-4 md:px-8 py-7 max-w-[1200px] mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Meal Planner</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-none tracking-tight text-text">
            {view === "week" ? "Week view" : "Month view"}
          </h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-bg-elev border border-border rounded-full p-1">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                view === v
                  ? "bg-surface text-text shadow-sm border border-border"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <WeekView
          groupSlug={groupSlug}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
        />
      ) : (
        <CalendarView
          groupSlug={groupSlug}
          monthOffset={monthOffset}
          onMonthChange={setMonthOffset}
        />
      )}
    </div>
  );
}
