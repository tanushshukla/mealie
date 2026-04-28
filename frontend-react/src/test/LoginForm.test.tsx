import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "./server";
import { LoginForm } from "../components/auth/LoginForm";

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    renderWithQuery(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls onSuccess with token on valid login", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    server.use(
      http.post("http://localhost:3000/api/auth/token", () =>
        HttpResponse.json({ access_token: "tok123", token_type: "bearer" }),
      ),
    );
    renderWithQuery(<LoginForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/email/i), "user@test.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("tok123"));
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("http://localhost:3000/api/auth/token", () =>
        HttpResponse.json({ detail: "Incorrect username or password" }, { status: 401 }),
      ),
    );
    renderWithQuery(<LoginForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), "bad@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
