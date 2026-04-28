import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "../components/auth/AuthCard";
import { LoginForm } from "../components/auth/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthCard>
      <h2 className="font-serif text-2xl text-text mb-6">Welcome back</h2>
      <LoginForm onSuccess={() => { window.location.href = "/"; }} />
    </AuthCard>
  );
}
