import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-brand-ink">
            ChopChop<em className="not-italic text-brand">Plan</em>
          </h1>
          <p className="text-text-muted text-sm mt-1">Your personal recipe planner</p>
        </div>
        <div className="bg-surface border border-border rounded-[14px] p-8 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
