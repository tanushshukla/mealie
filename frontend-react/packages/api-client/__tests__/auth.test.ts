import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, getMe } from "../auth";
import { ApiError } from "../client";

describe("login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns access_token on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "tok", token_type: "bearer" }), {
        status: 200,
      }),
    );
    const result = await login("user@test.com", "password");
    expect(result.access_token).toBe("tok");
  });

  it("throws ApiError on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 }),
    );
    await expect(login("bad", "creds")).rejects.toThrow(ApiError);
  });

  it("sends form-encoded body", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "t", token_type: "bearer" }), {
        status: 200,
      }),
    );
    await login("alice", "secret");
    const body = fetchSpy.mock.calls[0]?.[1]?.body as string;
    expect(body).toContain("username=alice");
    expect(body).toContain("grant_type=password");
  });
});

describe("getMe", () => {
  it("fetches current user", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ id: "1", email: "test@test.com", admin: false }),
        { status: 200 },
      ),
    );
    const user = await getMe();
    expect(user.email).toBe("test@test.com");
  });
});
