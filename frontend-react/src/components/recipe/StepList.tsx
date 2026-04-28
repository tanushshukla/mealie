import type { RecipeStep } from "@api-client";

function InlineMarkdown({ text }: { text: string }) {
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\))/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let last = 0;
  matches.forEach((m, i) => {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("**")) parts.push(<strong key={i}>{m[2]}</strong>);
    else if (m[0].startsWith("*")) parts.push(<em key={i}>{m[3]}</em>);
    else parts.push(<a key={i} href={m[5]} target="_blank" rel="noopener noreferrer" className="text-brand underline">{m[4]}</a>);
    last = (m.index ?? 0) + m[0].length;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

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
              <p className="text-sm text-text leading-relaxed pt-1 break-words"><InlineMarkdown text={step.text} /></p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
