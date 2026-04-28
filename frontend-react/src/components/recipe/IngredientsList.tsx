import type { RecipeIngredient } from "@api-client";

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
  bare?: boolean;
  scaleFactor?: number;
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

function formatIngredient(ing: RecipeIngredient, scaleFactor = 1): string {
  const rawQty = ing.quantity;
  const hasQty = rawQty != null && rawQty !== 0 && ing.disableAmount !== true;

  if (!hasQty || scaleFactor === 1) {
    if (ing.display) return ing.display;
    if (ing.originalText) return ing.originalText;
  }

  const parts: string[] = [];
  if (hasQty) parts.push(formatQty(rawQty! * scaleFactor));
  if (ing.unit) parts.push(ing.unit.abbreviation ?? ing.unit.name);
  if (ing.food) parts.push(ing.food.name);
  if (ing.note) parts.push(`(${ing.note})`);
  return parts.join(" ") || "—";
}

export function IngredientsList({ ingredients, bare, scaleFactor = 1 }: IngredientsListProps) {
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

  const body = (
    <div className="flex flex-col gap-5">
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
                {formatIngredient(ing, scaleFactor)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  if (bare) return body;

  return (
    <div className="bg-surface rounded-lg border border-border p-5 flex flex-col gap-5">
      <h2 className="font-serif text-xl text-text">Ingredients</h2>
      {body}
    </div>
  );
}
