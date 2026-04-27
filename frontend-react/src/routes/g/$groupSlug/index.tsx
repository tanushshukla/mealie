import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Search — coming in Task 14</div>,
});
