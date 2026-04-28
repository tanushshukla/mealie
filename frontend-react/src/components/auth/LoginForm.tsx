import { useState } from "react";
import { useLogin } from "../../hooks/useAuth";
import { authStore } from "../../lib/auth-store";
import { setToken } from "@api-client";

interface LoginFormProps {
  onSuccess: (token: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      authStore.setToken(result.access_token);
      setToken(result.access_token);
      onSuccess(result.access_token);
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border rounded-[8px] px-3 py-2.5 bg-bg-elev text-text text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-text">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border rounded-[8px] px-3 py-2.5 bg-bg-elev text-text text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      {error && (
        <div
          role="alert"
          className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-[8px] px-3 py-2"
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="bg-brand text-brand-fg font-medium text-sm py-2.5 rounded-[999px] hover:bg-brand-ink transition-colors disabled:opacity-60"
      >
        {loginMutation.isPending ? "Signing in…" : "Sign in"}
      </button>
      <a
        href="/forgot-password"
        className="text-center text-sm text-text-muted hover:text-text"
      >
        Forgot password?
      </a>
    </form>
  );
}
