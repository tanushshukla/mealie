import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "../components/auth/AuthCard";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthCard>
      <h2 className="font-serif text-2xl text-text mb-2">Reset password</h2>
      <p className="text-text-muted text-sm mb-6">
        Enter your email and we'll send reset instructions.
      </p>
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="border border-border rounded-[8px] px-3 py-2.5 bg-bg-elev text-text text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          className="bg-brand text-brand-fg font-medium text-sm py-2.5 rounded-[999px] hover:bg-brand-ink transition-colors"
        >
          Send reset link
        </button>
        <a href="/login" className="text-center text-sm text-text-muted hover:text-text">
          ← Back to sign in
        </a>
      </form>
    </AuthCard>
  );
}
