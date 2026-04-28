import type { RecipeSummary } from "@api-client";
import { recipeImageUrl } from "@api-client";

interface RecipeCardProps {
  recipe: RecipeSummary;
  onOpen: (r: RecipeSummary) => void;
  layout?: "grid" | "row";
  showSave?: boolean;
}

export function RecipeCard({ recipe, onOpen, layout = "grid", showSave = true }: RecipeCardProps) {
  const imgUrl = recipe.id ? recipeImageUrl(recipe.id) : undefined;

  if (layout === "row") {
    return (
      <div
        className="rcard-row cursor-pointer flex rounded-[14px] border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
        onClick={() => onOpen(recipe)}
      >
        <div
          className="w-[140px] flex-shrink-0 bg-bg-sunken"
          style={
            imgUrl
              ? { backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="flex flex-col gap-1.5 p-3.5">
          <div className="flex gap-1.5 flex-wrap">
            {recipe.tags?.slice(0, 1).map((t) => (
              <span
                key={t.id}
                className="text-[12px] font-medium px-2.5 py-1 rounded-[999px] bg-bg-elev border border-chip-border text-text-muted"
              >
                {t.name}
              </span>
            ))}
            {recipe.totalTime && (
              <span className="text-[12px] text-text-muted flex items-center gap-1">
                ⏱ {recipe.totalTime}
              </span>
            )}
          </div>
          <h3 className="font-serif text-[18px] leading-snug text-text">{recipe.name}</h3>
          {recipe.rating && (
            <span className="text-[13px] text-text-muted ml-auto">⭐ {recipe.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer flex flex-col rounded-[22px] border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
      onClick={() => onOpen(recipe)}
    >
      <div
        className="aspect-[4/3] relative bg-bg-sunken"
        style={
          imgUrl
            ? { backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        {recipe.totalTime && (
          <div className="absolute top-3 left-3 bg-white/95 text-text font-medium text-[11px] px-2 py-1 rounded-[999px] flex items-center gap-1">
            ⏱ {recipe.totalTime}
          </div>
        )}
        {showSave && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
            aria-label="Save"
          >
            🔖
          </button>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {recipe.tags?.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="text-[12px] font-medium px-2.5 py-1 rounded-[999px] bg-bg-elev border border-chip-border text-text-muted"
            >
              {t.name}
            </span>
          ))}
        </div>
        <h3 className="font-serif text-[18px] leading-snug text-text">{recipe.name}</h3>
        <div className="flex justify-between items-center mt-auto text-[13px] text-text-muted">
          <span>{recipe.recipeCategory?.[0]?.name ?? ""}</span>
          {recipe.rating && <span>⭐ {recipe.rating.toFixed(1)}</span>}
        </div>
      </div>
    </div>
  );
}
