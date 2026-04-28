import { useState } from "react";
import type { Recipe } from "@api-client";
import { recipeImageUrl } from "@api-client";

interface RecipeHeroProps {
  recipe: Recipe;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5 text-accent-ink" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(value) ? "" : "opacity-25"}>★</span>
      ))}
    </span>
  );
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function RecipeHero({ recipe }: RecipeHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const timeLabel = recipe.totalTime ?? recipe.cookTime ?? recipe.prepTime;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] overflow-hidden rounded-lg shadow-md bg-surface">
        <div
          className="aspect-[4/3] md:aspect-auto md:min-h-[320px] overflow-hidden bg-bg-muted cursor-zoom-in group relative"
          onClick={() => recipe.id && setLightboxOpen(true)}
        >
          {recipe.id ? (
            <>
              <img
                src={recipeImageUrl(recipe.id, "min")}
                alt={recipe.name ?? "Recipe image"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 rounded-full px-3 py-1.5 text-white text-xs font-medium backdrop-blur-sm">
                  View full image
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-dim cursor-default">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6l3 13h12l3-13H3z" />
                <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center gap-4">
          {(recipe.recipeCategory?.length || recipe.tags?.length) ? (
            <div className="flex flex-wrap gap-2">
              {recipe.recipeCategory?.map((cat) => (
                <span key={cat.id} className="px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-ink text-xs font-medium">
                  {cat.name}
                </span>
              ))}
              {recipe.tags?.map((tag) => (
                <span key={tag.id} className="px-2.5 py-0.5 rounded-full bg-bg-muted text-text-muted text-xs">
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}

          <h1 className="font-serif text-3xl md:text-4xl text-text leading-tight">
            {recipe.name}
          </h1>

          {recipe.description && (
            <p className="text-text-muted leading-relaxed line-clamp-4">{recipe.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted">
            {timeLabel && (
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {timeLabel}
              </span>
            )}
            {recipe.recipeServings != null && (
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {recipe.recipeServings} servings
              </span>
            )}
            {recipe.rating != null && recipe.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <StarRating value={recipe.rating} />
                <span>{recipe.rating.toFixed(1)}</span>
              </span>
            )}
            {recipe.recipeYield && (
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" />
                </svg>
                Yields {recipe.recipeYield}
              </span>
            )}
          </div>

          {recipe.orgURL && (
            <a
              href={recipe.orgURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:underline truncate"
            >
              Original source ↗
            </a>
          )}
        </div>
      </div>

      {lightboxOpen && recipe.id && (
        <ImageLightbox
          src={recipeImageUrl(recipe.id, "original")}
          alt={recipe.name ?? "Recipe image"}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
