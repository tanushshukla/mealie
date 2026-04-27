export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (_token) headers.set("Authorization", `Bearer ${_token}`);

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().then((t) => { try { return JSON.parse(t); } catch { return t || null; } });
    throw new ApiError(res.status, body, `API ${res.status}: ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
