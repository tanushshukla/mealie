import type { Nutrition } from "@api-client";

interface NutritionPanelProps {
  nutrition: Nutrition;
  bare?: boolean;
}

const ROWS: { label: string; key: keyof Nutrition }[] = [
  { label: "Calories", key: "calories" },
  { label: "Carbohydrates", key: "carbohydrateContent" },
  { label: "Protein", key: "proteinContent" },
  { label: "Fat", key: "fatContent" },
  { label: "Fiber", key: "fiberContent" },
  { label: "Sugar", key: "sugarContent" },
  { label: "Sodium", key: "sodiumContent" },
];

export function NutritionPanel({ nutrition, bare }: NutritionPanelProps) {
  const visibleRows = ROWS.filter((r) => nutrition[r.key] != null && nutrition[r.key] !== "");
  if (visibleRows.length === 0) return null;

  const body = (
    <>
      <p className="text-xs text-text-dim mb-2">Per serving</p>
      <div className="flex flex-col divide-y divide-border">
        {visibleRows.map(({ label, key }) => (
          <div key={key} className="flex justify-between py-2 text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="text-text font-medium">{nutrition[key]}</span>
          </div>
        ))}
      </div>
    </>
  );

  if (bare) return body;

  return (
    <div className="bg-surface rounded-lg border border-border p-5 flex flex-col gap-3">
      <h2 className="font-serif text-xl text-text">Nutrition</h2>
      {body}
    </div>
  );
}
