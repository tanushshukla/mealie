import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "../components/auth/AuthCard";
import { LoginForm } from "../components/auth/LoginForm";
import { getMe } from "@api-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  async function handleSuccess() {
    try {
      const me = await getMe();
      const slug = me.groupSlug;
      if (slug) {
        navigate({ to: "/g/$groupSlug/home", params: { groupSlug: slug } });
        return;
      }
    } catch {
      // fall through to default
    }
    navigate({ to: "/g/$groupSlug/home", params: { groupSlug: "home" } });
  }

  return (
    <AuthCard>
      <h2 className="font-serif text-2xl text-text mb-6">Welcome back</h2>
      <LoginForm onSuccess={handleSuccess} />
    </AuthCard>
  );
}
