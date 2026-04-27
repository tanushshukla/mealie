import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/recipes/finder/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Filter — coming in Task 16</div>,
});
