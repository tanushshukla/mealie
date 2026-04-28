import type { RecipeStep } from "@api-client";

interface StepListProps {
  steps: RecipeStep[];
}

export function StepList({ steps }: StepListProps) {
  if (steps.length === 0) return null;

  const sections: { title?: string; items: { step: RecipeStep; num: number }[] }[] = [];
  let current: { title?: string; items: { step: RecipeStep; num: number }[] } = { items: [] };
  let counter = 1;

  for (const step of steps) {
    if (step.title) {
      if (current.items.length > 0 || current.title) sections.push(current);
      current = { title: step.title, items: [] };
    } else {
      current.items.push({ step, num: counter++ });
    }
  }
  if (current.items.length > 0 || current.title) sections.push(current);

  return (
    <div className="bg-surface rounded-lg border border-border p-5 flex flex-col gap-6">
      <h2 className="font-serif text-xl text-text">Instructions</h2>
      {sections.map((section, si) => (
        <div key={si} className="flex flex-col gap-5">
          {section.title && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {section.title}
            </h3>
          )}
          {section.items.map(({ step, num }) => (
            <div key={step.id ?? num} className="flex gap-4">
              <span
                className="shrink-0 w-8 h-8 rounded-full bg-brand-soft text-brand-ink font-serif text-sm font-medium flex items-center justify-center"
                aria-hidden="true"
              >
                {num}
              </span>
              <p className="text-sm text-text leading-relaxed pt-1">{step.text}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
