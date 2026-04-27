const KEY = "access_token";

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(KEY, token);
  },
  clearToken(): void {
    localStorage.removeItem(KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(KEY);
  },
};
