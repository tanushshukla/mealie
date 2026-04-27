import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, setToken, ApiError } from "../client";

describe("apiFetch", () => {
  beforeEach(() => {
    setToken(null);
    vi.restoreAllMocks();
  });

  it("sends Authorization header when token is set", async () => {
    setToken("test-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await apiFetch("/api/test");
    expect(fetchSpy.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer test-token",
    });
  });

  it("omits Authorization header when no token", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    await apiFetch("/api/test");
    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers?.["Authorization"]).toBeUndefined();
  });

  it("throws ApiError on non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Not found" }), { status: 404 }),
    );
    await expect(apiFetch("/api/missing")).rejects.toThrow(ApiError);
  });

  it("includes status code in ApiError", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 401 }),
    );
    try {
      await apiFetch("/api/protected");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(401);
    }
  });
});
