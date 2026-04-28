import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, getMe, setToken } from "@api-client";
import { authStore } from "../lib/auth-store";

export const meQueryKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: getMe,
    enabled: authStore.isAuthenticated(),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    authStore.clearToken();
    setToken(null);
    qc.clear();
    window.location.href = "/login";
  };
}
