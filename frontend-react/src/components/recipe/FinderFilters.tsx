import { useState } from "react";
import { useTags, useCategories, useFoods } from "../../hooks/useOrganizers";

interface FinderFiltersProps {
  selectedTags: string[];
  selectedCategories: string[];
  selectedFoods: string[];
  cookTime: number;
  onTagsChange: (tags: string[]) => void;
  onCategoriesChange: (cats: string[]) => void;
  onFoodsChange: (foods: string[]) => void;
  onCookTimeChange: (t: number) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FinderFilters({
  selectedTags, selectedCategories, selectedFoods, cookTime,
  onTagsChange, onCategoriesChange, onFoodsChange, onCookTimeChange,
}: FinderFiltersProps) {
  const { data: tags } = useTags();
  const { data: categories } = useCategories();
  const { data: foods } = useFoods();
  const [foodSearch, setFoodSearch] = useState("");

  const filteredFoods = foods?.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase()),
  ) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {tags?.map((t) => (
            <button
              key={t.id}
              onClick={() => onTagsChange(toggle(selectedTags, t.slug))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedTags.includes(t.slug)
                  ? "bg-brand-soft text-brand-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Categories</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategoriesChange(toggle(selectedCategories, c.slug))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedCategories.includes(c.slug)
                  ? "bg-brand-soft text-brand-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Ingredients</h3>
        <input
          value={foodSearch}
          onChange={(e) => setFoodSearch(e.target.value)}
          placeholder="Search ingredients…"
          className="w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-bg-elev text-text outline-none focus:border-brand mb-2"
        />
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {filteredFoods.slice(0, 60).map((f) => (
            <button
              key={f.id}
              onClick={() => onFoodsChange(toggle(selectedFoods, f.id))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedFoods.includes(f.id)
                  ? "bg-accent text-accent-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Max cook time</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={cookTime}
            onChange={(e) => onCookTimeChange(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <span className="font-semibold text-text tabular-nums w-16">
            {cookTime}
            <small className="font-normal text-text-muted ml-0.5 text-[10px]">min</small>
          </span>
        </div>
      </section>
    </div>
  );
}
