import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMe } from "../../../../hooks/useAuth";
import { useRecipes } from "../../../../hooks/useRecipes";
import { useMealPlans, useShoppingLists, useShoppingList } from "../../../../hooks/usePlanner";
import { RecipeCard } from "../../../../components/recipe/RecipeCard";
import { recipeImageUrl } from "@api-client";
import type { RecipeSummary } from "@api-client";

export const Route = createFileRoute("/g/$groupSlug/home/")({
  component: HomePage,
});

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isoWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const salut = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${salut}, ${name.split(" ")[0]}.` : `${salut}.`;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${accent ? "bg-brand-soft border-brand/20" : "bg-surface border-border"}`}>
      <div className="text-xs text-text-dim uppercase tracking-wider">{label}</div>
      <div className={`font-serif text-3xl font-medium leading-none ${accent ? "text-brand-ink" : "text-text"}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

function HomePage() {
  const { groupSlug } = Route.useParams();
  const navigate = useNavigate();

  const { data: me } = useMe();
  const today = toISO(new Date());
  const weekStart = useMemo(() => toISO(isoWeekStart()), []);
  const weekEnd = useMemo(() => {
    const d = isoWeekStart();
    d.setDate(d.getDate() + 6);
    return toISO(d);
  }, []);

  const { data: todayPlan = [] } = useMealPlans(today, today);
  const { data: weekPlan = [] } = useMealPlans(weekStart, weekEnd);
  const { data: recentData } = useRecipes({ orderBy: "created_at", orderDirection: "desc", perPage: 4 });
  const { data: allData } = useRecipes({ perPage: 1 });
  const { data: shoppingLists = [] } = useShoppingLists();
  const firstListId = shoppingLists[0]?.id ?? "";
  const { data: shoppingList } = useShoppingList(firstListId);

  const tonightDinner = todayPlan.find((e) => e.entryType === "dinner") ?? todayPlan[0];
  const recentRecipes = recentData?.items ?? [];
  const totalRecipes = allData?.total ?? 0;
  const plannedMeals = weekPlan.length;
  const shoppingPending = (shoppingList?.listItems ?? []).filter((i) => !i.checked).length;

  const dayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  const handleOpen = (recipe: RecipeSummary) => {
    navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: recipe.slug ?? "" } });
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1200px] mx-auto flex flex-col gap-10">

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="flex flex-col gap-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">{dayLabel}</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
            {greeting(me?.fullName ?? me?.username)}{" "}
            <em className="italic font-normal text-brand">What's cooking?</em>
          </h1>
          <p className="text-text-muted leading-relaxed max-w-md">
            {plannedMeals > 0
              ? `You have ${plannedMeals} meal${plannedMeals !== 1 ? "s" : ""} planned this week.`
              : "Nothing planned yet — add meals to your planner to get started."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/g/$groupSlug/recipes/finder"
              params={{ groupSlug }}
              className="flex items-center gap-2 bg-brand text-brand-fg text-sm font-medium px-4 py-2.5 rounded-full hover:bg-brand-ink transition-colors"
            >
              ✨ Cook with what I have
            </Link>
            <Link
              to="/g/$groupSlug/planner"
              params={{ groupSlug }}
              className="flex items-center gap-2 bg-surface border border-border text-text text-sm font-medium px-4 py-2.5 rounded-full hover:bg-bg-elev transition-colors"
            >
              📅 See this week
            </Link>
          </div>
        </div>

        {/* Tonight's dinner card */}
        {tonightDinner?.recipe && (
          <div
            className="w-full md:w-72 rounded-2xl overflow-hidden border border-border bg-surface shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => tonightDinner.recipe?.slug && navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug: tonightDinner.recipe.slug } })}
          >
            {tonightDinner.recipe.id && (
              <div className="relative">
                <img
                  src={recipeImageUrl(tonightDinner.recipe.id, "min")}
                  alt={tonightDinner.recipe.name ?? ""}
                  className="w-full aspect-[3/2] object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[11px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                  🌙 Tonight's {tonightDinner.entryType}
                </div>
              </div>
            )}
            <div className="p-4 flex flex-col gap-1">
              {tonightDinner.recipe.recipeCategory?.[0] && (
                <span className="text-[11px] text-brand font-medium">{tonightDinner.recipe.recipeCategory[0].name}</span>
              )}
              <h3 className="font-serif text-base text-text leading-snug">{tonightDinner.recipe.name}</h3>
              {tonightDinner.recipe.totalTime && (
                <span className="text-xs text-text-muted">⏱ {tonightDinner.recipe.totalTime}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Recipe library" value={totalRecipes.toLocaleString()} sub="recipes saved" accent />
        <StatCard label="Planned this week" value={plannedMeals} sub={`${weekStart} – ${weekEnd}`} />
        <StatCard
          label="Shopping list"
          value={shoppingPending}
          sub={shoppingPending === 1 ? "item to grab" : "items to grab"}
        />
        <StatCard
          label="This week"
          value={Math.max(0, plannedMeals)}
          sub={plannedMeals > 0 ? "meals on the plan" : "nothing planned yet"}
        />
      </div>

      {/* Recent recipes */}
      {recentRecipes.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Recently added</div>
              <h2 className="font-serif text-2xl text-text">Latest to the library</h2>
            </div>
            <Link
              to="/g/$groupSlug"
              params={{ groupSlug }}
              className="text-sm text-text-muted hover:text-text flex items-center gap-1"
            >
              All recipes →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentRecipes.map((r) => (
              <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} />
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Recipe Finder", desc: "Filter by ingredient, diet, time", icon: "✨", to: `/g/${groupSlug}/recipes/finder` },
          { label: "Meal Planner", desc: "Plan your week, breakfast to dinner", icon: "📅", to: `/g/${groupSlug}/planner` },
          { label: "Shopping List", desc: "Auto-generated from your plan", icon: "🛒", to: `/g/${groupSlug}/shopping` },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to as string}
            className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface hover:bg-bg-elev transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="text-sm font-semibold text-text">{item.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
            </div>
          </Link>
        ))}
      </section>

    </div>
  );
}
