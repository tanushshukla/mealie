import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/r/$slug/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Detail — coming in Task 17</div>,
});
