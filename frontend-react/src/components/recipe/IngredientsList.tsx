import type { RecipeIngredient } from "@api-client";

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
}

function formatIngredient(ing: RecipeIngredient): string {
  if (ing.display) return ing.display;
  if (ing.originalText) return ing.originalText;

  const parts: string[] = [];
  if (ing.quantity != null && ing.quantity !== 0) {
    parts.push(String(ing.quantity));
  }
  if (ing.unit) {
    parts.push(ing.unit.abbreviation ?? ing.unit.name);
  }
  if (ing.food) {
    parts.push(ing.food.name);
  }
  if (ing.note) {
    parts.push(`(${ing.note})`);
  }
  return parts.join(" ") || "—";
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  if (ingredients.length === 0) return null;

  const sections: { title?: string; items: RecipeIngredient[] }[] = [];
  let current: { title?: string; items: RecipeIngredient[] } = { items: [] };

  for (const ing of ingredients) {
    if (ing.title) {
      if (current.items.length > 0 || current.title) sections.push(current);
      current = { title: ing.title, items: [] };
    } else {
      current.items.push(ing);
    }
  }
  if (current.items.length > 0 || current.title) sections.push(current);

  return (
    <div className="bg-surface rounded-lg border border-border p-5 flex flex-col gap-5">
      <h2 className="font-serif text-xl text-text">Ingredients</h2>
      {sections.map((section, si) => (
        <div key={si} className="flex flex-col gap-2">
          {section.title && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {section.title}
            </h3>
          )}
          <ul className="flex flex-col gap-2">
            {section.items.map((ing, ii) => (
              <li key={ii} className="flex items-start gap-2 text-sm text-text">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                {formatIngredient(ing)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
