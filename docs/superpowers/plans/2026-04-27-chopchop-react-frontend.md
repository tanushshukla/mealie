# ChopChopPlan React Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React 19 + TanStack Router + Tailwind v4 frontend in `frontend-react/` that replaces the Vue/Nuxt UI for auth, recipe search, recipe filter, and recipe detail pages.

**Architecture:** Vite 8 SPA with file-based TanStack Router. API client lives in `packages/api-client/` (pure TypeScript, no React) for future React Native reuse. TanStack Query manages server state. Design tokens from the `chop-chop-plan-prototype/` are mapped into Tailwind v4 `@theme {}` CSS blocks.

**Tech Stack:** React 19.2.5, Vite 8, @tanstack/react-router 1.168.x, @tanstack/react-query 5.100.x, Tailwind CSS 4.2, shadcn/ui CLI v4, Zod 4.3.6, Vitest + React Testing Library + MSW v2

**Real API endpoints (from existing frontend):**
- `POST /api/auth/token` — form-encoded `username` + `password` → `{ access_token, token_type }`
- `GET /api/users/self` → current User
- `GET /api/recipes` — query: `search`, `tags[]`, `categories[]`, `foods[]`, `page`, `perPage`, `orderBy`, `orderDirection` → `PaginationData<RecipeSummary>`
- `GET /api/recipes/{slug}` → `Recipe`
- `GET /api/organizers/tags` → tags list
- `GET /api/organizers/categories` → categories list
- `GET /api/foods` → foods list
- Images: `/api/media/recipes/{recipeId}/images/original.webp`

---

## File Map

```
frontend-react/
├── packages/api-client/
│   ├── types.ts          # All shared TS types (RecipeSummary, Recipe, User, etc.)
│   ├── client.ts         # Base fetch wrapper with token injection + ApiError
│   ├── auth.ts           # login(), getMe()
│   ├── recipes.ts        # listRecipes(), getRecipe()
│   ├── organizers.ts     # listTags(), listCategories(), listFoods()
│   └── index.ts          # Barrel export
├── src/
│   ├── styles/tokens.css               # CSS vars from prototype + Tailwind @theme
│   ├── lib/
│   │   ├── query-client.ts             # TanStack Query client + global 401 handler
│   │   └── auth-store.ts              # localStorage token get/set/clear
│   ├── hooks/
│   │   ├── useAuth.ts                 # useMe(), useLogin(), useLogout()
│   │   ├── useRecipes.ts              # useRecipes(params), useRecipe(slug)
│   │   └── useOrganizers.ts           # useTags(), useCategories(), useFoods()
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── MobileTabbar.tsx
│   │   │   └── MobileDrawer.tsx
│   │   ├── recipe/
│   │   │   ├── RecipeCard.tsx          # grid + row variants
│   │   │   ├── RecipeGrid.tsx          # responsive grid wrapper
│   │   │   ├── FilterBar.tsx           # tabs + time + season + view toggle
│   │   │   ├── FinderFilters.tsx       # independent tag/category/food pickers
│   │   │   ├── RecipeHero.tsx          # two-col hero for detail page
│   │   │   ├── IngredientsList.tsx     # serving scaler + checkable rows
│   │   │   ├── NutritionPanel.tsx      # macro bars + detail table
│   │   │   └── StepList.tsx            # numbered steps with active state
│   │   └── auth/
│   │       ├── AuthCard.tsx
│   │       └── LoginForm.tsx
│   └── routes/
│       ├── __root.tsx                  # Root layout + auth guard
│       ├── login.tsx
│       ├── forgot-password.tsx
│       └── g/$groupSlug/
│           ├── index.tsx               # Recipe search
│           ├── recipes/finder/index.tsx # Recipe filter
│           └── r/$slug/index.tsx       # Recipe detail
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `frontend-react/package.json`
- Create: `frontend-react/vite.config.ts`
- Create: `frontend-react/tsconfig.json`
- Create: `frontend-react/index.html`

- [ ] **Step 1: Create the directory and package.json**

```bash
mkdir -p frontend-react/packages/api-client frontend-react/src/{styles,lib,hooks,components/{layout,recipe,auth},routes/g}
```

Create `frontend-react/package.json`:
```json
{
  "name": "chopchop-plan-web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "@tanstack/react-router": "^1.168.24",
    "@tanstack/react-query": "^5.100.5",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "@tanstack/router-plugin": "latest",
    "@tailwindcss/vite": "^4.2.0",
    "tailwindcss": "^4.2.0",
    "typescript": "^5.8.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vite": "^8.0.8",
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@testing-library/jest-dom": "latest",
    "msw": "^2.0.0",
    "jsdom": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend-react && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "./src/routes" }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@api-client": ["./packages/api-client/index.ts"]
    },
    "skipLibCheck": true
  },
  "include": ["src", "packages"]
}
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChopChopPlan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 6: Create src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";

const root = document.getElementById("root")!;
createRoot(root).render(<StrictMode><div>ChopChopPlan loading…</div></StrictMode>);
```

- [ ] **Step 7: Verify dev server starts**

```bash
cd frontend-react && npm run dev
```

Expected: Vite starts on `http://localhost:5173`, browser shows "ChopChopPlan loading…" with no console errors.

- [ ] **Step 8: Commit**

```bash
cd frontend-react && git add . && git commit -m "feat: scaffold React frontend with Vite 8 + TanStack Router + Tailwind v4"
```

---

## Task 2: Design tokens (tokens.css)

**Files:**
- Create: `frontend-react/src/styles/tokens.css`

- [ ] **Step 1: Create tokens.css**

```css
@import "tailwindcss";

/* ── Palette ── */
:root {
  --sage-50:  #f3f7f1; --sage-100: #e6efe1; --sage-200: #cfdec6;
  --sage-300: #a8c598; --sage-400: #7da26b; --sage-500: #5a8348;
  --sage-600: #426634; --sage-700: #314e27; --sage-800: #21351a;
  --sage-900: #142210;

  --cream-50: #faf6ec; --cream-100: #f3ebd0;
  --cream-200: #e9dba2; --cream-300: #dcc66c;

  --paper-50:  #fbfaf6; --paper-100: #f5f3ec; --paper-200: #ebe7da;
  --paper-300: #d9d4c1; --paper-400: #a8a293; --paper-500: #6f6a5e;
  --paper-700: #3a382f; --paper-900: #1a1a14;

  --tomato: #c64a3a;
  --plum:   #6e3d63;
  --sky:    #5b8aa0;

  --radius-sm:   8px;
  --radius:      14px;
  --radius-lg:   22px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(20,34,16,.06), 0 1px 1px rgba(20,34,16,.04);
  --shadow:    0 6px 20px -8px rgba(20,34,16,.18), 0 2px 6px -2px rgba(20,34,16,.08);
  --shadow-lg: 0 24px 48px -16px rgba(20,34,16,.25), 0 8px 16px -8px rgba(20,34,16,.12);
}

/* ── Light theme (default) ── */
:root, [data-theme="light"] {
  --bg:           var(--paper-50);
  --bg-elev:      #ffffff;
  --bg-sunken:    var(--paper-100);
  --bg-muted:     var(--paper-200);
  --surface:      #ffffff;
  --border:       #ebe7da;
  --border-strong:#d9d4c1;
  --text:         #1a2418;
  --text-muted:   #5d6557;
  --text-dim:     #8b9181;
  --brand:        var(--sage-600);
  --brand-soft:   var(--sage-100);
  --brand-ink:    var(--sage-800);
  --brand-fg:     #ffffff;
  --accent:       var(--cream-200);
  --accent-ink:   #5a4915;
  --danger:       var(--tomato);
  --chip-bg:      #ffffff;
  --chip-border:  #e2dfd2;
  --sidebar-bg:   #f8f5ea;
  --sidebar-text: #3a382f;
}

/* ── Dark theme ── */
[data-theme="dark"] {
  --bg:           #14180f;
  --bg-elev:      #1c2117;
  --bg-sunken:    #0f1309;
  --bg-muted:     #232a1d;
  --surface:      #1c2117;
  --border:       #2c3324;
  --border-strong:#3a4430;
  --text:         #ecead9;
  --text-muted:   #a7ad97;
  --text-dim:     #757b66;
  --brand:        var(--sage-300);
  --brand-soft:   #2a3a22;
  --brand-ink:    var(--sage-100);
  --brand-fg:     #14180f;
  --accent:       #c8b15a;
  --accent-ink:   #1a1a10;
  --chip-bg:      #232a1d;
  --chip-border:  #3a4430;
  --sidebar-bg:   #181c12;
  --sidebar-text: #f4f1de;
}

/* ── Base reset ── */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1,h2,h3,h4 {
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0;
}

/* ── Tailwind semantic tokens ── */
@theme {
  --color-brand:         var(--brand);
  --color-brand-soft:    var(--brand-soft);
  --color-brand-ink:     var(--brand-ink);
  --color-brand-fg:      var(--brand-fg);
  --color-surface:       var(--surface);
  --color-bg:            var(--bg);
  --color-bg-elev:       var(--bg-elev);
  --color-bg-sunken:     var(--bg-sunken);
  --color-bg-muted:      var(--bg-muted);
  --color-border:        var(--border);
  --color-border-strong: var(--border-strong);
  --color-text:          var(--text);
  --color-text-muted:    var(--text-muted);
  --color-text-dim:      var(--text-dim);
  --color-accent:        var(--accent);
  --color-accent-ink:    var(--accent-ink);
  --color-danger:        var(--danger);
  --color-sidebar-bg:    var(--sidebar-bg);
  --color-sidebar-text:  var(--sidebar-text);

  --font-serif: "Fraunces", "Source Serif 4", Georgia, serif;
  --font-sans:  "Inter Tight", "Inter", system-ui, -apple-system, sans-serif;
  --font-mono:  "JetBrains Mono", ui-monospace, monospace;

  --radius-sm:   8px;
  --radius:      14px;
  --radius-lg:   22px;
  --radius-pill: 9999px;

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow);
  --shadow-lg: var(--shadow-lg);
}
```

- [ ] **Step 2: Verify tokens apply**

Run dev server (`npm run dev`). Open browser, inspect `<html>` — confirm `--brand` resolves to `#426634` in the computed styles panel.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css && git commit -m "feat: add design tokens from ChopChopPlan prototype mapped to Tailwind v4 @theme"
```

---

## Task 3: Test infrastructure

**Files:**
- Create: `frontend-react/vitest.config.ts`
- Create: `frontend-react/src/test/setup.ts`
- Create: `frontend-react/src/test/server.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@api-client": "/packages/api-client/index.ts" },
  },
});
```

- [ ] **Step 2: Create src/test/setup.ts**

```ts
import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());
```

- [ ] **Step 3: Create src/test/server.ts**

```ts
import { setupServer } from "msw/node";
export const server = setupServer();
```

- [ ] **Step 4: Run tests to confirm setup works**

```bash
cd frontend-react && npm run test:run
```

Expected: `No test files found` — that's fine, confirms Vitest runs without errors.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/ && git commit -m "feat: add Vitest + React Testing Library + MSW test infrastructure"
```

---

## Task 4: API client — types

**Files:**
- Create: `frontend-react/packages/api-client/types.ts`

- [ ] **Step 1: Create packages/api-client/types.ts**

```ts
export interface User {
  id: string;
  username?: string | null;
  fullName?: string | null;
  email: string;
  admin: boolean;
  group?: string | null;
  groupId?: string | null;
  groupSlug?: string | null;
  householdId?: string | null;
}

export interface RecipeTag {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
}

export interface RecipeCategory {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
}

export interface IngredientFood {
  id: string;
  name: string;
  pluralName?: string | null;
  description?: string;
}

export interface RecipeSummary {
  id?: string | null;
  name?: string | null;
  slug?: string;
  image?: unknown;
  recipeServings?: number;
  recipeYield?: string | null;
  totalTime?: string | null;
  prepTime?: string | null;
  cookTime?: string | null;
  description?: string | null;
  recipeCategory?: RecipeCategory[] | null;
  tags?: RecipeTag[] | null;
  rating?: number | null;
  dateAdded?: string | null;
  lastMade?: string | null;
}

export interface RecipeIngredient {
  quantity?: number | null;
  unit?: { name: string; abbreviation?: string } | null;
  food?: { name: string } | null;
  note?: string | null;
  display?: string | null;
  title?: string | null;
  isFood?: boolean | null;
  disableAmount?: boolean | null;
  originalText?: string | null;
}

export interface RecipeStep {
  id?: string | null;
  title?: string | null;
  text: string;
}

export interface Nutrition {
  calories?: string | null;
  fatContent?: string | null;
  proteinContent?: string | null;
  carbohydrateContent?: string | null;
  fiberContent?: string | null;
  sodiumContent?: string | null;
  sugarContent?: string | null;
}

export interface Recipe extends RecipeSummary {
  recipeIngredient?: RecipeIngredient[];
  recipeInstructions?: RecipeStep[] | null;
  nutrition?: Nutrition | null;
  orgURL?: string | null;
  notes?: Array<{ title: string; text: string }> | null;
}

export interface PaginationData<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: T[];
}

export interface RecipeListParams {
  search?: string;
  tags?: string[];
  categories?: string[];
  foods?: string[];
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-client/types.ts && git commit -m "feat: add API client types (User, Recipe, RecipeSummary, PaginationData)"
```

---

## Task 5: API client — base client + auth

**Files:**
- Create: `frontend-react/packages/api-client/client.ts`
- Create: `frontend-react/packages/api-client/auth.ts`
- Create: `frontend-react/src/test/api-client.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend-react/src/test/api-client.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { apiFetch, ApiError } from "../../packages/api-client/client";
import { login, getMe } from "../../packages/api-client/auth";

const BASE = "http://localhost";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("injects Authorization header when token present", async () => {
    localStorage.setItem("access_token", "test-token");
    let receivedAuth = "";
    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        receivedAuth = request.headers.get("Authorization") ?? "";
        return HttpResponse.json({ ok: true });
      })
    );
    await apiFetch("/api/test");
    expect(receivedAuth).toBe("Bearer test-token");
  });

  it("throws ApiError on non-2xx response", async () => {
    server.use(
      http.get(`${BASE}/api/fail`, () => HttpResponse.json({ detail: "not found" }, { status: 404 }))
    );
    await expect(apiFetch("/api/fail")).rejects.toBeInstanceOf(ApiError);
  });

  it("ApiError has status code", async () => {
    server.use(
      http.get(`${BASE}/api/fail`, () => HttpResponse.json({}, { status: 401 }))
    );
    try {
      await apiFetch("/api/fail");
    } catch (e) {
      expect((e as ApiError).status).toBe(401);
    }
  });
});

describe("login", () => {
  it("returns access_token on success", async () => {
    server.use(
      http.post(`${BASE}/api/auth/token`, () =>
        HttpResponse.json({ access_token: "abc123", token_type: "bearer" })
      )
    );
    const result = await login("user@test.com", "password");
    expect(result.access_token).toBe("abc123");
  });
});

describe("getMe", () => {
  it("returns user", async () => {
    localStorage.setItem("access_token", "tok");
    server.use(
      http.get(`${BASE}/api/users/self`, () =>
        HttpResponse.json({ id: "1", email: "user@test.com", admin: false })
      )
    );
    const user = await getMe();
    expect(user.email).toBe("user@test.com");
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd frontend-react && npm run test:run src/test/api-client.test.ts
```

Expected: `Cannot find module '../../packages/api-client/client'`

- [ ] **Step 3: Create packages/api-client/client.ts**

```ts
const BASE_URL = "";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

- [ ] **Step 4: Create packages/api-client/auth.ts**

```ts
import { apiFetch } from "./client";
import type { AuthToken, User } from "./types";

export async function login(email: string, password: string): Promise<AuthToken> {
  const body = new URLSearchParams({ username: email, password });
  return apiFetch<AuthToken>("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/api/users/self");
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd frontend-react && npm run test:run src/test/api-client.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api-client/client.ts packages/api-client/auth.ts src/test/api-client.test.ts && git commit -m "feat: add API client base fetch with token injection and auth endpoints"
```

---

## Task 6: API client — recipes + organizers

**Files:**
- Create: `frontend-react/packages/api-client/recipes.ts`
- Create: `frontend-react/packages/api-client/organizers.ts`
- Create: `frontend-react/packages/api-client/media.ts`
- Create: `frontend-react/packages/api-client/index.ts`
- Create: `frontend-react/src/test/recipes-api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend-react/src/test/recipes-api.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { listRecipes, getRecipe } from "../../packages/api-client/recipes";
import { listTags, listCategories } from "../../packages/api-client/organizers";

describe("listRecipes", () => {
  it("returns paginated recipes", async () => {
    server.use(
      http.get("http://localhost/api/recipes", () =>
        HttpResponse.json({ page: 1, per_page: 30, total: 2, total_pages: 1,
          items: [{ id: "1", name: "Pasta", slug: "pasta" }] })
      )
    );
    const result = await listRecipes({});
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Pasta");
  });

  it("forwards search param", async () => {
    let url = "";
    server.use(
      http.get("http://localhost/api/recipes", ({ request }) => {
        url = request.url;
        return HttpResponse.json({ page: 1, per_page: 30, total: 0, total_pages: 0, items: [] });
      })
    );
    await listRecipes({ search: "chicken" });
    expect(url).toContain("search=chicken");
  });
});

describe("getRecipe", () => {
  it("returns a recipe by slug", async () => {
    server.use(
      http.get("http://localhost/api/recipes/pasta-bolognese", () =>
        HttpResponse.json({ id: "1", name: "Pasta Bolognese", slug: "pasta-bolognese" })
      )
    );
    const recipe = await getRecipe("pasta-bolognese");
    expect(recipe.name).toBe("Pasta Bolognese");
  });
});

describe("listTags", () => {
  it("returns tags array", async () => {
    server.use(
      http.get("http://localhost/api/organizers/tags", () =>
        HttpResponse.json({ items: [{ id: "1", name: "Weeknight", slug: "weeknight" }] })
      )
    );
    const result = await listTags();
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd frontend-react && npm run test:run src/test/recipes-api.test.ts
```

Expected: `Cannot find module '../../packages/api-client/recipes'`

- [ ] **Step 3: Create packages/api-client/recipes.ts**

```ts
import { apiFetch } from "./client";
import type { Recipe, RecipeSummary, PaginationData, RecipeListParams } from "./types";

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k, String(item)));
    else qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listRecipes(params: RecipeListParams): Promise<PaginationData<RecipeSummary>> {
  const { page = 1, perPage = 30, ...rest } = params;
  const query = buildQuery({ page, perPage, ...rest });
  return apiFetch<PaginationData<RecipeSummary>>(`/api/recipes${query}`);
}

export async function getRecipe(slug: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/recipes/${slug}`);
}
```

- [ ] **Step 4: Create packages/api-client/organizers.ts**

```ts
import { apiFetch } from "./client";
import type { RecipeTag, RecipeCategory, IngredientFood, PaginationData } from "./types";

export async function listTags(): Promise<RecipeTag[]> {
  const res = await apiFetch<PaginationData<RecipeTag>>("/api/organizers/tags?perPage=300");
  return res.items;
}

export async function listCategories(): Promise<RecipeCategory[]> {
  const res = await apiFetch<PaginationData<RecipeCategory>>("/api/organizers/categories?perPage=300");
  return res.items;
}

export async function listFoods(): Promise<IngredientFood[]> {
  const res = await apiFetch<PaginationData<IngredientFood>>("/api/foods?perPage=500");
  return res.items;
}
```

- [ ] **Step 5: Create packages/api-client/media.ts**

```ts
export function recipeImageUrl(recipeId: string, size: "original" | "min" | "tiny" = "tiny"): string {
  const suffix = size === "original" ? "original" : size === "min" ? "min-original" : "tiny-original";
  return `/api/media/recipes/${recipeId}/images/${suffix}.webp`;
}
```

- [ ] **Step 6: Create packages/api-client/index.ts**

```ts
export * from "./types";
export * from "./client";
export * from "./auth";
export * from "./recipes";
export * from "./organizers";
export * from "./media";
```

- [ ] **Step 6: Run tests — confirm pass**

```bash
cd frontend-react && npm run test:run src/test/recipes-api.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/api-client/ src/test/recipes-api.test.ts && git commit -m "feat: add recipe and organizer API client functions"
```

---

## Task 7: Auth store + Query client

**Files:**
- Create: `frontend-react/src/lib/auth-store.ts`
- Create: `frontend-react/src/lib/query-client.ts`

- [ ] **Step 1: Create src/lib/auth-store.ts**

```ts
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
```

- [ ] **Step 2: Create src/lib/query-client.ts**

```ts
import { QueryClient } from "@tanstack/react-query";
import { authStore } from "./auth-store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
          authStore.clearToken();
          window.location.href = "/login";
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ && git commit -m "feat: add auth token store and TanStack Query client with global 401 handler"
```

---

## Task 8: Router setup + root layout

**Files:**
- Modify: `frontend-react/src/main.tsx`
- Create: `frontend-react/src/routes/__root.tsx`
- Create: `frontend-react/src/routes/login.tsx`
- Create: `frontend-react/src/routes/forgot-password.tsx`
- Create: `frontend-react/src/routes/g/$groupSlug/index.tsx` (stub)
- Create: `frontend-react/src/routes/g/$groupSlug/r/$slug/index.tsx` (stub)
- Create: `frontend-react/src/routes/g/$groupSlug/recipes/finder/index.tsx` (stub)

- [ ] **Step 1: Update src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/query-client";
import "./styles/tokens.css";

const router = createRouter({
  routeTree,
  context: { queryClient },
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 2: Create src/routes/__root.tsx**

```tsx
import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { authStore } from "../lib/auth-store";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const publicPaths = ["/login", "/forgot-password"];
    const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));
    if (!isPublic && !authStore.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
```

- [ ] **Step 3: Create stub auth routes**

`frontend-react/src/routes/login.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/login")({
  component: () => <div className="p-8 font-sans text-text">Login — coming in Task 9</div>,
});
```

`frontend-react/src/routes/forgot-password.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/forgot-password")({
  component: () => <div className="p-8 font-sans text-text">Forgot Password — coming in Task 9</div>,
});
```

- [ ] **Step 4: Create stub app routes**

`frontend-react/src/routes/g/$groupSlug/index.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Search — coming in Task 14</div>,
});
```

`frontend-react/src/routes/g/$groupSlug/r/$slug/index.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/r/$slug/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Detail — coming in Task 17</div>,
});
```

`frontend-react/src/routes/g/$groupSlug/recipes/finder/index.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/g/$groupSlug/recipes/finder/")({
  component: () => <div className="p-8 font-sans text-text">Recipe Filter — coming in Task 16</div>,
});
```

- [ ] **Step 5: Verify router generates routeTree.gen.ts and dev server starts**

```bash
cd frontend-react && npm run dev
```

Expected: Vite generates `src/routeTree.gen.ts`, browser at `/` redirects to `/login`, shows "Login — coming in Task 9".

- [ ] **Step 6: Commit**

```bash
git add src/ && git commit -m "feat: add TanStack Router with auth guard, root layout, and stub routes"
```

---

## Task 9: Auth pages

**Files:**
- Create: `frontend-react/src/hooks/useAuth.ts`
- Create: `frontend-react/src/components/auth/AuthCard.tsx`
- Create: `frontend-react/src/components/auth/LoginForm.tsx`
- Modify: `frontend-react/src/routes/login.tsx`
- Modify: `frontend-react/src/routes/forgot-password.tsx`
- Create: `frontend-react/src/test/LoginForm.test.tsx`

- [ ] **Step 1: Write failing LoginForm test**

`frontend-react/src/test/LoginForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { LoginForm } from "../components/auth/LoginForm";

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls onSuccess with token on valid login", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    server.use(
      http.post("/api/auth/token", () =>
        HttpResponse.json({ access_token: "tok123", token_type: "bearer" })
      )
    );
    render(<LoginForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/email/i), "user@test.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onSuccess).toHaveBeenCalledWith("tok123");
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/token", () => HttpResponse.json({ detail: "Incorrect username or password" }, { status: 401 }))
    );
    render(<LoginForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), "bad@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd frontend-react && npm run test:run src/test/LoginForm.test.tsx
```

Expected: `Cannot find module '../components/auth/LoginForm'`

- [ ] **Step 3: Create src/hooks/useAuth.ts**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, getMe } from "@api-client";
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
    qc.clear();
    window.location.href = "/login";
  };
}
```

- [ ] **Step 4: Create src/components/auth/AuthCard.tsx**

```tsx
import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-brand-ink">ChopChop<em className="italic text-brand not-italic">Plan</em></h1>
          <p className="text-text-muted text-sm mt-1">Your personal recipe planner</p>
        </div>
        <div className="bg-surface border border-border rounded-[14px] p-8 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create src/components/auth/LoginForm.tsx**

```tsx
import { useState } from "react";
import { useLogin } from "../../hooks/useAuth";
import { authStore } from "../../lib/auth-store";

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
      onSuccess(result.access_token);
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-text">Email</label>
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
        <label htmlFor="password" className="text-sm font-medium text-text">Password</label>
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
        <div role="alert" className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-[8px] px-3 py-2">
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
      <a href="/forgot-password" className="text-center text-sm text-text-muted hover:text-text">
        Forgot password?
      </a>
    </form>
  );
}
```

- [ ] **Step 6: Update routes/login.tsx**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { AuthCard } from "../components/auth/AuthCard";
import { LoginForm } from "../components/auth/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthCard>
      <h2 className="font-serif text-2xl text-text mb-6">Welcome back</h2>
      <LoginForm onSuccess={() => navigate({ to: "/g/home" })} />
    </AuthCard>
  );
}
```

- [ ] **Step 7: Update routes/forgot-password.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "../components/auth/AuthCard";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthCard>
      <h2 className="font-serif text-2xl text-text mb-2">Reset password</h2>
      <p className="text-text-muted text-sm mb-6">Enter your email and we'll send reset instructions.</p>
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text">Email</label>
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
        <a href="/login" className="text-center text-sm text-text-muted hover:text-text">← Back to sign in</a>
      </form>
    </AuthCard>
  );
}
```

- [ ] **Step 8: Run tests — confirm pass**

```bash
cd frontend-react && npm run test:run src/test/LoginForm.test.tsx
```

Expected: all 3 tests pass.

- [ ] **Step 9: Verify in browser**

Open `http://localhost:5173/login`. Confirm: centered card renders, form has email/password fields, submit shows loading state.

- [ ] **Step 10: Commit**

```bash
git add src/ && git commit -m "feat: add login and forgot-password pages with AuthCard and LoginForm"
```

---

## Task 10: Layout shell — Sidebar + Topbar

**Files:**
- Create: `frontend-react/src/components/layout/Sidebar.tsx`
- Create: `frontend-react/src/components/layout/Topbar.tsx`
- Create: `frontend-react/src/components/layout/MobileTabbar.tsx`
- Create: `frontend-react/src/components/layout/MobileDrawer.tsx`
- Modify: `frontend-react/src/routes/__root.tsx`

- [ ] **Step 1: Create src/components/layout/Sidebar.tsx**

```tsx
import { Link, useRouterState } from "@tanstack/react-router";

const NAV_MAIN = [
  { id: "recipes", label: "Recipes", href: "/g/home", icon: "📖" },
  { id: "finder", label: "Recipe Finder", href: "/g/home/recipes/finder", icon: "✨" },
];
const NAV_FOOT = [
  { id: "settings", label: "Settings", href: "#", icon: "⚙️" },
];

interface SidebarProps {
  groupSlug: string;
  onClose?: () => void;
  mobile?: boolean;
}

export function Sidebar({ groupSlug, onClose, mobile }: SidebarProps) {
  const state = useRouterState();
  const path = state.location.pathname;

  const navMain = [
    { id: "recipes", label: "Recipes", href: `/g/${groupSlug}`, icon: "📖" },
    { id: "finder", label: "Recipe Finder", href: `/g/${groupSlug}/recipes/finder`, icon: "✨" },
  ];

  return (
    <aside className="bg-sidebar-bg border-r border-border flex flex-col gap-1 p-4 h-full">
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center text-brand text-lg">🍴</div>
        <span className="font-serif text-[19px] font-semibold tracking-tight text-text">
          ChopChop<em className="italic text-brand font-medium">Plan</em>
        </span>
        {mobile && (
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center text-text-muted hover:text-text">✕</button>
        )}
      </div>

      <button className="flex items-center justify-center gap-2 bg-brand text-brand-fg text-sm font-medium py-2 rounded-[999px] mx-1.5 mb-2 hover:bg-brand-ink transition-colors">
        + New recipe
      </button>

      <div className="text-[11px] font-semibold uppercase tracking-widest text-text-dim px-2.5 mt-3 mb-1.5">Cook</div>
      {navMain.map((n) => {
        const active = path === n.href || (n.href !== `/g/${groupSlug}` && path.startsWith(n.href));
        return (
          <Link
            key={n.id}
            to={n.href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
              active
                ? "bg-bg-elev text-brand-ink border border-border shadow-sm"
                : "text-sidebar-text hover:bg-black/5"
            }`}
          >
            <span className="text-base">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        );
      })}

      <div className="mt-auto">
        <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-bg-elev border border-border">
          <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink text-xs font-semibold">U</div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-text">Account</span>
            <span className="text-xs text-text-muted">{groupSlug}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create src/components/layout/Topbar.tsx**

```tsx
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";

interface TopbarProps {
  title: string;
  eyebrow?: string;
  theme: "light" | "dark";
  onTheme: () => void;
  onMenu?: () => void;
  mobile?: boolean;
  groupSlug?: string;
}

export function Topbar({ title, eyebrow, theme, onTheme, onMenu, mobile, groupSlug }: TopbarProps) {
  const navigate = useNavigate();

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && groupSlug) {
      const q = (e.target as HTMLInputElement).value;
      navigate({ to: `/g/${groupSlug}`, search: { q } });
    }
  }, [navigate, groupSlug]);

  return (
    <div className="sticky top-0 z-20 border-b border-border flex items-center gap-3 px-6 min-h-[64px]"
      style={{ background: "color-mix(in oklab, var(--bg) 85%, transparent)", backdropFilter: "blur(12px)" }}>
      {mobile && (
        <button onClick={onMenu} className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-muted hover:bg-bg-elev">☰</button>
      )}
      <div className="flex flex-col min-w-0 flex-shrink-0">
        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-widest text-text-dim">{eyebrow}</div>}
        <h2 className="font-serif text-[22px] font-medium text-text truncate">{title}</h2>
      </div>
      {!mobile && groupSlug && (
        <div className="flex-1 max-w-[480px] mx-auto flex items-center gap-2 bg-bg-elev border border-border rounded-[999px] px-3.5 py-2 text-text-muted">
          <span className="text-sm">🔍</span>
          <input
            className="flex-1 bg-transparent border-0 outline-none text-text text-sm"
            placeholder="Search recipes, ingredients…"
            onKeyDown={handleSearch}
          />
          <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-border bg-bg-sunken text-text-dim">⌘K</kbd>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button onClick={onTheme} className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-muted hover:bg-bg-elev hover:border hover:border-border">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink text-xs font-semibold ml-1">U</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/layout/MobileTabbar.tsx**

```tsx
import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { label: "Recipes", href: (s: string) => `/g/${s}`, icon: "📖", matchFn: (path: string, s: string) => path === `/g/${s}` },
  { label: "Finder", href: (s: string) => `/g/${s}/recipes/finder`, icon: "✨", matchFn: (path: string, s: string) => path.startsWith(`/g/${s}/recipes/finder`) },
];

export function MobileTabbar({ groupSlug }: { groupSlug: string }) {
  const state = useRouterState();
  const path = state.location.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex z-30">
      {TABS.map((t) => {
        const active = t.matchFn(path, groupSlug);
        return (
          <Link key={t.label} to={t.href(groupSlug)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${active ? "text-brand" : "text-text-muted"}`}>
            <span className="text-xl">{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Create src/components/layout/MobileDrawer.tsx**

```tsx
import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  groupSlug: string;
}

export function MobileDrawer({ open, onClose, groupSlug }: MobileDrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-72 bg-sidebar-bg h-full shadow-lg z-50">
        <Sidebar groupSlug={groupSlug} onClose={onClose} mobile />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update src/routes/__root.tsx to use the shell**

```tsx
import { createRootRouteWithContext, Outlet, redirect, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { authStore } from "../lib/auth-store";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { MobileTabbar } from "../components/layout/MobileTabbar";
import { MobileDrawer } from "../components/layout/MobileDrawer";

interface RouterContext { queryClient: QueryClient }

const PUBLIC_PATHS = ["/login", "/forgot-password"];

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));
    if (!isPublic && !authStore.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const { pathname } = window.location;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return <Outlet />;
  return <AppShell />;
}

function AppShell() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const groupSlug = window.location.pathname.split("/")[2] ?? "home";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className={`flex min-h-screen bg-bg ${isMobile ? "" : "grid"}`}
      style={!isMobile ? { gridTemplateColumns: isTablet ? "72px 1fr" : "240px 1fr" } : undefined}>
      {!isMobile && (
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar groupSlug={groupSlug} />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <Topbar
          title="ChopChopPlan"
          theme={theme}
          onTheme={toggleTheme}
          mobile={isMobile}
          onMenu={() => setMobileNavOpen(true)}
          groupSlug={groupSlug}
        />
        <main className={`flex-1 ${isMobile ? "pb-20" : ""}`}>
          <Outlet />
        </main>
        {isMobile && <MobileTabbar groupSlug={groupSlug} />}
      </div>
      {isMobile && (
        <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} groupSlug={groupSlug} />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify layout in browser**

Start dev server. Log in (or add a token manually in localStorage). Open `/g/home`. Confirm: sidebar shows on desktop, bottom tabs on mobile (resize to < 768px), topbar renders.

- [ ] **Step 7: Commit**

```bash
git add src/ && git commit -m "feat: add responsive app shell with Sidebar, Topbar, MobileTabbar, MobileDrawer"
```

---

## Task 11: Recipe hooks

**Files:**
- Create: `frontend-react/src/hooks/useRecipes.ts`
- Create: `frontend-react/src/hooks/useOrganizers.ts`
- Create: `frontend-react/src/test/useRecipes.test.tsx`

- [ ] **Step 1: Write failing hook test**

`frontend-react/src/test/useRecipes.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { useRecipes, useRecipe } from "../hooks/useRecipes";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useRecipes", () => {
  it("returns recipe items", async () => {
    server.use(
      http.get("/api/recipes", () =>
        HttpResponse.json({ page: 1, per_page: 30, total: 1, total_pages: 1,
          items: [{ id: "1", name: "Pasta", slug: "pasta" }] })
      )
    );
    const { result } = renderHook(() => useRecipes({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

describe("useRecipe", () => {
  it("fetches single recipe", async () => {
    server.use(
      http.get("/api/recipes/pasta", () =>
        HttpResponse.json({ id: "1", name: "Pasta", slug: "pasta" })
      )
    );
    const { result } = renderHook(() => useRecipe("pasta"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("Pasta");
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd frontend-react && npm run test:run src/test/useRecipes.test.tsx
```

Expected: `Cannot find module '../hooks/useRecipes'`

- [ ] **Step 3: Create src/hooks/useRecipes.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { listRecipes, getRecipe } from "@api-client";
import type { RecipeListParams } from "@api-client";

export const recipeKeys = {
  all: ["recipes"] as const,
  list: (params: RecipeListParams) => ["recipes", "list", params] as const,
  detail: (slug: string) => ["recipes", "detail", slug] as const,
};

export function useRecipes(params: RecipeListParams) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => listRecipes(params),
  });
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: recipeKeys.detail(slug),
    queryFn: () => getRecipe(slug),
    enabled: !!slug,
  });
}
```

- [ ] **Step 4: Create src/hooks/useOrganizers.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { listTags, listCategories, listFoods } from "@api-client";

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: listTags, staleTime: 1000 * 60 * 10 });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: listCategories, staleTime: 1000 * 60 * 10 });
}

export function useFoods() {
  return useQuery({ queryKey: ["foods"], queryFn: listFoods, staleTime: 1000 * 60 * 10 });
}
```

- [ ] **Step 5: Run tests — confirm pass**

```bash
cd frontend-react && npm run test:run src/test/useRecipes.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/test/useRecipes.test.tsx && git commit -m "feat: add useRecipes, useRecipe, useOrganizers hooks with TanStack Query"
```

---

## Task 12: RecipeCard + RecipeGrid components

**Files:**
- Create: `frontend-react/src/components/recipe/RecipeCard.tsx`
- Create: `frontend-react/src/components/recipe/RecipeGrid.tsx`
- Create: `frontend-react/src/test/RecipeCard.test.tsx`

- [ ] **Step 1: Write failing test**

`frontend-react/src/test/RecipeCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeCard } from "../components/recipe/RecipeCard";
import type { RecipeSummary } from "@api-client";

const recipe: RecipeSummary = {
  id: "1", name: "Lemon Pasta", slug: "lemon-pasta",
  totalTime: "25 min", rating: 4.5,
  tags: [{ id: "t1", name: "Weeknight", slug: "weeknight" }],
  recipeCategory: [{ id: "c1", name: "Pasta", slug: "pasta" }],
};

describe("RecipeCard", () => {
  it("renders recipe name", () => {
    render(<RecipeCard recipe={recipe} onOpen={vi.fn()} />);
    expect(screen.getByText("Lemon Pasta")).toBeInTheDocument();
  });

  it("calls onOpen when clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecipeCard recipe={recipe} onOpen={onOpen} />);
    await user.click(screen.getByText("Lemon Pasta"));
    expect(onOpen).toHaveBeenCalledWith(recipe);
  });

  it("renders in row layout", () => {
    const { container } = render(<RecipeCard recipe={recipe} onOpen={vi.fn()} layout="row" />);
    expect(container.firstChild).toHaveClass("rcard-row");
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd frontend-react && npm run test:run src/test/RecipeCard.test.tsx
```

Expected: `Cannot find module '../components/recipe/RecipeCard'`

- [ ] **Step 3: Create src/components/recipe/RecipeCard.tsx**

```tsx
import type { RecipeSummary } from "@api-client";
import { recipeImageUrl } from "@api-client";

interface RecipeCardProps {
  recipe: RecipeSummary;
  onOpen: (r: RecipeSummary) => void;
  layout?: "grid" | "row";
  showSave?: boolean;
}

export function RecipeCard({ recipe, onOpen, layout = "grid", showSave = true }: RecipeCardProps) {
  const imgUrl = recipe.id ? recipeImageUrl(recipe.id) : undefined;

  if (layout === "row") {
    return (
      <div className="rcard-row cursor-pointer flex rounded-[14px] border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
        onClick={() => onOpen(recipe)}>
        <div className="w-[140px] flex-shrink-0 bg-bg-sunken"
          style={imgUrl ? { backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
        <div className="flex flex-col gap-1.5 p-3.5">
          <div className="flex gap-1.5 flex-wrap">
            {recipe.tags?.slice(0, 1).map((t) => (
              <span key={t.id} className="text-[12px] font-medium px-2.5 py-1 rounded-[999px] bg-bg-elev border border-chip-border text-text-muted">{t.name}</span>
            ))}
            {recipe.totalTime && (
              <span className="text-[12px] text-text-muted flex items-center gap-1">⏱ {recipe.totalTime}</span>
            )}
          </div>
          <h3 className="font-serif text-[18px] leading-snug text-text">{recipe.name}</h3>
          {recipe.rating && (
            <span className="text-[13px] text-text-muted ml-auto">⭐ {recipe.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-pointer flex flex-col rounded-[22px] border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
      onClick={() => onOpen(recipe)}>
      <div className="aspect-[4/3] relative bg-bg-sunken"
        style={imgUrl ? { backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        {recipe.totalTime && (
          <div className="absolute top-3 left-3 bg-white/95 text-text font-medium text-[11px] px-2 py-1 rounded-[999px] flex items-center gap-1">
            ⏱ {recipe.totalTime}
          </div>
        )}
        {showSave && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
            aria-label="Save">
            🔖
          </button>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {recipe.tags?.slice(0, 2).map((t) => (
            <span key={t.id} className="text-[12px] font-medium px-2.5 py-1 rounded-[999px] bg-bg-elev border border-chip-border text-text-muted">{t.name}</span>
          ))}
        </div>
        <h3 className="font-serif text-[18px] leading-snug text-text">{recipe.name}</h3>
        <div className="flex justify-between items-center mt-auto text-[13px] text-text-muted">
          <span>{recipe.recipeCategory?.[0]?.name ?? ""}</span>
          {recipe.rating && <span>⭐ {recipe.rating.toFixed(1)}</span>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/recipe/RecipeGrid.tsx**

```tsx
import type { ReactNode } from "react";

interface RecipeGridProps {
  children: ReactNode;
  variant?: "default" | "lg";
}

export function RecipeGrid({ children, variant = "default" }: RecipeGridProps) {
  const cols = variant === "lg"
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={`grid gap-4 ${cols}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run tests — confirm pass**

```bash
cd frontend-react && npm run test:run src/test/RecipeCard.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/recipe/RecipeCard.tsx src/components/recipe/RecipeGrid.tsx src/test/RecipeCard.test.tsx && git commit -m "feat: add RecipeCard (grid + row) and RecipeGrid components"
```

---

## Task 13: Recipe Search page

**Files:**
- Create: `frontend-react/src/components/recipe/FilterBar.tsx`
- Modify: `frontend-react/src/routes/g/$groupSlug/index.tsx`

- [ ] **Step 1: Create src/components/recipe/FilterBar.tsx**

```tsx
import { useTags } from "../../hooks/useOrganizers";

interface FilterBarProps {
  activeTag: string;
  onTagChange: (tag: string) => void;
  maxTime: number;
  onTimeChange: (t: number) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}

export function FilterBar({ activeTag, onTagChange, maxTime, onTimeChange, view, onViewChange }: FilterBarProps) {
  const { data: tags } = useTags();
  const allTabs = ["All", ...(tags?.map((t) => t.name) ?? [])];

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border mb-3.5 flex-wrap">
      <div className="flex gap-1 overflow-x-auto flex-shrink-0 max-w-full">
        {allTabs.slice(0, 12).map((tab) => (
          <button key={tab}
            onClick={() => onTagChange(tab)}
            className={`px-3.5 py-2 rounded-[999px] text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTag === tab
                ? "bg-text text-bg"
                : "text-text-muted hover:text-text hover:bg-bg-elev"
            }`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <div className="flex items-center gap-2 bg-bg-elev border border-border rounded-[999px] px-3.5 py-2 text-[13px]">
          <span className="text-text-muted">⏱ ≤</span>
          <input
            type="range" min={10} max={120} step={5} value={maxTime}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="w-24 accent-brand"
          />
          <span className="font-semibold text-text tabular-nums">{maxTime}<small className="font-normal text-text-muted ml-0.5 text-[10px]">min</small></span>
        </div>
        <div className="flex bg-bg-elev border border-border rounded-[999px] p-1">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 rounded-[999px] text-[13px] transition-colors ${view === v ? "bg-text text-bg" : "text-text-muted"}`}>
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update src/routes/g/$groupSlug/index.tsx**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod/v4";
import { useRecipes } from "../../../hooks/useRecipes";
import { RecipeCard } from "../../../components/recipe/RecipeCard";
import { RecipeGrid } from "../../../components/recipe/RecipeGrid";
import { FilterBar } from "../../../components/recipe/FilterBar";
import type { RecipeSummary } from "@api-client";

const searchSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional(),
});

export const Route = createFileRoute("/g/$groupSlug/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: RecipeSearchPage,
});

function RecipeSearchPage() {
  const { groupSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [activeTag, setActiveTag] = useState(search.tags?.[0] ?? "All");
  const [maxTime, setMaxTime] = useState(120);
  const [view, setView] = useState<"grid" | "list">("grid");

  const params = {
    search: search.q,
    tags: activeTag !== "All" ? [activeTag] : undefined,
  };

  const { data, isLoading } = useRecipes(params);

  const handleOpen = (recipe: RecipeSummary) => {
    navigate({ to: `/g/${groupSlug}/r/${recipe.slug}` });
  };

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    navigate({ search: (prev) => ({ ...prev, tags: tag !== "All" ? [tag] : undefined }) });
  };

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <div className="flex justify-between items-end mb-5 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Cookbook</div>
          <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] max-w-[700px]">
            A small library of <em className="italic font-normal text-brand">good things</em>.
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-brand text-brand-fg text-sm font-medium px-4 py-2.5 rounded-[999px] hover:bg-brand-ink transition-colors">
          + Add recipe
        </button>
      </div>

      <FilterBar
        activeTag={activeTag}
        onTagChange={handleTagChange}
        maxTime={maxTime}
        onTimeChange={setMaxTime}
        view={view}
        onViewChange={setView}
      />

      <div className="text-[13px] text-text-muted mb-4">
        <strong className="text-text">{data?.total ?? 0}</strong> recipes · sorted by recently added
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
          ))}
        </div>
      ) : view === "grid" ? (
        <RecipeGrid>
          {data?.items.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={handleOpen} />)}
        </RecipeGrid>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data?.items.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={handleOpen} layout="row" />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/g/home`. Confirm: serif heading renders, filter tabs show (loaded from API), recipe grid shows (or skeleton while loading), filter tabs change results.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: add Recipe Search page with FilterBar, tag filtering, grid/list toggle"
```

---

## Task 14: Recipe Filter page (fixes ordering bug)

**Files:**
- Create: `frontend-react/src/components/recipe/FinderFilters.tsx`
- Modify: `frontend-react/src/routes/g/$groupSlug/recipes/finder/index.tsx`

- [ ] **Step 1: Create src/components/recipe/FinderFilters.tsx**

```tsx
import { useState } from "react";
import { useTags, useCategories, useFoods } from "../../hooks/useOrganizers";

interface FinderFiltersProps {
  selectedTags: string[];
  selectedCategories: string[];
  selectedFoods: string[];
  cookTime: number;
  onTagsChange: (tags: string[]) => void;
  onCategoriesChange: (cats: string[]) => void;
  onFoodsChange: (foods: string[]) => void;
  onCookTimeChange: (t: number) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FinderFilters({
  selectedTags, selectedCategories, selectedFoods, cookTime,
  onTagsChange, onCategoriesChange, onFoodsChange, onCookTimeChange
}: FinderFiltersProps) {
  const { data: tags } = useTags();
  const { data: categories } = useCategories();
  const { data: foods } = useFoods();
  const [foodSearch, setFoodSearch] = useState("");

  const filteredFoods = foods?.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  ) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {tags?.map((t) => (
            <button key={t.id}
              onClick={() => onTagsChange(toggle(selectedTags, t.slug))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedTags.includes(t.slug)
                  ? "bg-brand-soft text-brand-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Categories</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories?.map((c) => (
            <button key={c.id}
              onClick={() => onCategoriesChange(toggle(selectedCategories, c.slug))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedCategories.includes(c.slug)
                  ? "bg-brand-soft text-brand-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Ingredients</h3>
        <input
          value={foodSearch}
          onChange={(e) => setFoodSearch(e.target.value)}
          placeholder="Search ingredients…"
          className="w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-bg-elev text-text outline-none focus:border-brand mb-2"
        />
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {filteredFoods.slice(0, 60).map((f) => (
            <button key={f.id}
              onClick={() => onFoodsChange(toggle(selectedFoods, f.id))}
              className={`px-3 py-1.5 rounded-[999px] text-[12px] font-medium border transition-colors ${
                selectedFoods.includes(f.id)
                  ? "bg-accent text-accent-ink border-transparent"
                  : "bg-chip-bg border-chip-border text-text-muted hover:border-border-strong"
              }`}>
              {f.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-dim mb-2">Max cook time</h3>
        <div className="flex items-center gap-3">
          <input type="range" min={10} max={120} step={5} value={cookTime}
            onChange={(e) => onCookTimeChange(Number(e.target.value))}
            className="flex-1 accent-brand" />
          <span className="font-semibold text-text tabular-nums w-16">{cookTime}<small className="font-normal text-text-muted ml-0.5 text-[10px]">min</small></span>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update src/routes/g/$groupSlug/recipes/finder/index.tsx**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod/v4";
import { useRecipes } from "../../../../../hooks/useRecipes";
import { FinderFilters } from "../../../../../components/recipe/FinderFilters";
import { RecipeCard } from "../../../../../components/recipe/RecipeCard";
import { RecipeGrid } from "../../../../../components/recipe/RecipeGrid";
import type { RecipeSummary } from "@api-client";

const searchSchema = z.object({
  tags:       z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  foods:      z.array(z.string()).optional(),
  cookTime:   z.number().optional(),
});

export const Route = createFileRoute("/g/$groupSlug/recipes/finder/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: RecipeFinderPage,
});

function RecipeFinderPage() {
  const { groupSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const tags       = search.tags ?? [];
  const categories = search.categories ?? [];
  const foods      = search.foods ?? [];
  const cookTime   = search.cookTime ?? 60;

  const { data, isLoading } = useRecipes({
    tags:       tags.length ? tags : undefined,
    categories: categories.length ? categories : undefined,
    foods:      foods.length ? foods : undefined,
  });

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const handleOpen = (recipe: RecipeSummary) =>
    navigate({ to: `/g/${groupSlug}/r/${recipe.slug}` });

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Smart cooking</div>
        <h1 className="font-serif text-[48px] leading-none tracking-[-0.025em]">
          Find something to <em className="italic font-normal text-brand">make.</em>
        </h1>
        <p className="text-text-muted mt-2 max-w-[480px]">
          Filter by tags, categories, or ingredients — all filters are independent, select in any order.
        </p>
      </div>

      <div className="flex gap-8 items-start" style={{ display: "grid", gridTemplateColumns: "300px 1fr" }}>
        <aside className="bg-surface border border-border rounded-[14px] p-5 sticky top-[80px]">
          <FinderFilters
            selectedTags={tags}
            selectedCategories={categories}
            selectedFoods={foods}
            cookTime={cookTime}
            onTagsChange={(t) => updateSearch({ tags: t.length ? t : undefined })}
            onCategoriesChange={(c) => updateSearch({ categories: c.length ? c : undefined })}
            onFoodsChange={(f) => updateSearch({ foods: f.length ? f : undefined })}
            onCookTimeChange={(t) => updateSearch({ cookTime: t })}
          />
          {(tags.length || categories.length || foods.length) ? (
            <button
              onClick={() => navigate({ search: {} })}
              className="mt-4 w-full text-sm text-text-muted hover:text-text py-2 border border-border rounded-[8px] transition-colors">
              Clear all filters
            </button>
          ) : null}
        </aside>

        <div>
          <div className="text-[13px] text-text-muted mb-4">
            <strong className="text-text">{data?.total ?? 0}</strong> recipes match
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="border border-border rounded-[14px] bg-surface p-12 text-center">
              <div className="text-4xl mb-3">🌿</div>
              <h3 className="font-serif text-xl text-text mb-1">Nothing matches yet</h3>
              <p className="text-text-muted text-sm">Try different tags, categories, or removing some filters.</p>
            </div>
          ) : (
            <RecipeGrid variant="lg">
              {data?.items.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={handleOpen} />)}
            </RecipeGrid>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/g/home/recipes/finder`. Confirm: three filter sections render (Tags, Categories, Ingredients), clicking any filter chip updates results immediately, filters do not depend on each other.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: add Recipe Filter page with independent tag/category/food filters (fixes ordering bug)"
```

---

## Task 15: Recipe Detail page

**Files:**
- Create: `frontend-react/src/components/recipe/RecipeHero.tsx`
- Create: `frontend-react/src/components/recipe/IngredientsList.tsx`
- Create: `frontend-react/src/components/recipe/NutritionPanel.tsx`
- Create: `frontend-react/src/components/recipe/StepList.tsx`
- Modify: `frontend-react/src/routes/g/$groupSlug/r/$slug/index.tsx`

- [ ] **Step 1: Create src/components/recipe/RecipeHero.tsx**

```tsx
import type { Recipe } from "@api-client";
import { recipeImageUrl } from "@api-client";

interface RecipeHeroProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeHero({ recipe, onBack }: RecipeHeroProps) {
  const imgUrl = recipe.id ? recipeImageUrl(recipe.id, "original") : undefined;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        ← Back to recipes
      </button>
      <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
        <div className="flex flex-col justify-center">
          <div className="flex gap-2 flex-wrap mb-3">
            {recipe.recipeCategory?.map((c) => (
              <span key={c.id} className="px-3 py-1 rounded-[999px] bg-accent text-accent-ink text-[12px] font-medium">{c.name}</span>
            ))}
            {recipe.tags?.map((t) => (
              <span key={t.id} className="px-3 py-1 rounded-[999px] bg-bg-elev border border-chip-border text-text-muted text-[12px] font-medium">{t.name}</span>
            ))}
          </div>
          <h1 className="font-serif text-[44px] leading-[1.05] tracking-[-0.02em] text-text mb-2">{recipe.name}</h1>
          <p className="text-text-muted text-sm mb-5">Serves {recipe.recipeServings ?? "?"}</p>
          <div className="flex gap-6 mb-6">
            {recipe.totalTime && (
              <div><div className="text-[11px] text-text-dim uppercase tracking-widest font-semibold mb-0.5">Time</div>
                <div className="font-serif text-2xl text-text">{recipe.totalTime}</div></div>
            )}
            {recipe.rating && (
              <div><div className="text-[11px] text-text-dim uppercase tracking-widest font-semibold mb-0.5">Rating</div>
                <div className="font-serif text-2xl text-text">⭐ {recipe.rating.toFixed(1)}</div></div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="flex items-center gap-2 bg-brand text-brand-fg text-sm font-medium px-4 py-2.5 rounded-[999px] hover:bg-brand-ink transition-colors">
              ▶ Start cooking
            </button>
            <button className="flex items-center gap-2 border border-border bg-bg-elev text-text text-sm font-medium px-4 py-2.5 rounded-[999px] hover:border-border-strong transition-colors">
              🔖 Save
            </button>
          </div>
        </div>
        <div className="rounded-[22px] overflow-hidden bg-bg-sunken aspect-[4/3]"
          style={imgUrl ? { backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/recipe/IngredientsList.tsx**

```tsx
import { useState } from "react";
import type { Recipe } from "@api-client";

interface IngredientsListProps {
  recipe: Recipe;
}

export function IngredientsList({ recipe }: IngredientsListProps) {
  const [servings, setServings] = useState(recipe.recipeServings ?? 4);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const ratio = servings / (recipe.recipeServings ?? 4);
  const ingredients = recipe.recipeIngredient ?? [];

  function formatIngredient(ing: typeof ingredients[0], ratio: number): string {
    if (ing.originalText) {
      if (ing.quantity) {
        const scaled = (ing.quantity * ratio);
        const qty = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
        return ing.originalText.replace(String(ing.quantity), qty);
      }
      return ing.originalText;
    }
    const qty = ing.quantity ? (ing.quantity * ratio) : null;
    const qtyStr = qty ? (qty % 1 === 0 ? String(qty) : qty.toFixed(1)) : "";
    const unit = ing.unit?.abbreviation ?? ing.unit?.name ?? "";
    const food = ing.food?.name ?? "";
    const note = ing.note ? `, ${ing.note}` : "";
    return [qtyStr, unit, food, note].filter(Boolean).join(" ").trim();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl text-text">Ingredients</h3>
        <div className="flex items-center gap-2 border border-border rounded-[999px] px-2 py-1">
          <button onClick={() => setServings(Math.max(1, servings - 1))}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text">−</button>
          <span className="text-sm font-medium text-text px-1">{servings} servings</span>
          <button onClick={() => setServings(servings + 1)}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text">+</button>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {ingredients.map((ing, i) => (
          <li key={i} className={`flex items-start gap-3 ${checked[i] ? "opacity-50 line-through" : ""}`}>
            <button
              onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
              className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                checked[i] ? "bg-brand border-brand text-brand-fg" : "border-border"
              }`}>
              {checked[i] && <span className="text-[10px]">✓</span>}
            </button>
            <span className="text-sm text-text">{formatIngredient(ing, ratio)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/recipe/NutritionPanel.tsx**

```tsx
import type { Nutrition } from "@api-client";

interface NutritionPanelProps {
  nutrition: Nutrition;
  servings?: number;
}

export function NutritionPanel({ nutrition }: NutritionPanelProps) {
  const macros = [
    { label: "Fat", value: nutrition.fatContent, color: "var(--accent)" },
    { label: "Carbs", value: nutrition.carbohydrateContent, color: "var(--brand)" },
    { label: "Protein", value: nutrition.proteinContent, color: "var(--tomato)" },
  ];

  return (
    <div>
      <p className="text-[12px] text-text-muted mb-3">Per serving · estimated</p>
      <div className="flex gap-4 mb-4">
        <div>
          <div className="font-serif text-[40px] leading-none text-text">{nutrition.calories ?? "—"}</div>
          <div className="text-[12px] text-text-muted">kcal</div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {macros.map((m) => {
            const v = parseFloat(m.value ?? "0");
            return (
              <div key={m.label}>
                <div className="h-1.5 bg-bg-sunken rounded-full overflow-hidden mb-0.5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, v * 1.2)}%`, background: m.color }} />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>{m.label}</span><strong className="text-text">{m.value ?? "—"}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {[
            ["Fibre", nutrition.fiberContent],
            ["Sodium", nutrition.sodiumContent],
            ["Sugar", nutrition.sugarContent],
          ].map(([k, v]) => (
            <tr key={k} className="border-t border-border">
              <td className="py-2 text-text-muted">{k}</td>
              <td className="py-2 text-right font-medium text-text">{v ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-text-dim mt-3">Estimated from ingredient data.</p>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/recipe/StepList.tsx**

```tsx
import { useState } from "react";
import type { RecipeStep } from "@api-client";

interface StepListProps {
  steps: RecipeStep[];
}

export function StepList({ steps }: StepListProps) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div>
      <h3 className="font-serif text-xl text-text mb-4">Method</h3>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <li key={i}
              onClick={() => setActiveStep(i)}
              className={`flex gap-4 p-4 rounded-[14px] cursor-pointer transition-all border ${
                isActive ? "border-border bg-bg-elev shadow-sm" :
                isDone ? "border-transparent opacity-60" :
                "border-transparent hover:bg-bg-elev/50"
              }`}>
              <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5 ${
                isDone ? "bg-brand text-brand-fg" :
                isActive ? "bg-brand-soft text-brand-ink border-2 border-brand" :
                "bg-bg-muted text-text-dim"
              }`}>
                {isDone ? "✓" : i + 1}
              </div>
              <div className="flex-1">
                {step.title && <div className="font-medium text-text text-sm mb-1">{step.title}</div>}
                <p className={`text-sm ${isActive ? "text-text" : "text-text-muted"}`}>{step.text}</p>
                {isActive && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveStep(Math.min(steps.length - 1, activeStep + 1)); }}
                      className="bg-brand text-brand-fg text-sm font-medium px-4 py-2 rounded-[999px] hover:bg-brand-ink transition-colors flex items-center gap-1.5">
                      Done ✓
                    </button>
                    <button className="border border-border bg-bg-elev text-text text-sm px-4 py-2 rounded-[999px] hover:border-border-strong transition-colors flex items-center gap-1.5">
                      ⏱ Set timer
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 5: Update src/routes/g/$groupSlug/r/$slug/index.tsx**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useRecipe } from "../../../../hooks/useRecipes";
import { RecipeHero } from "../../../../components/recipe/RecipeHero";
import { IngredientsList } from "../../../../components/recipe/IngredientsList";
import { NutritionPanel } from "../../../../components/recipe/NutritionPanel";
import { StepList } from "../../../../components/recipe/StepList";

export const Route = createFileRoute("/g/$groupSlug/r/$slug/")({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { groupSlug, slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading, isError } = useRecipe(slug);
  const [tab, setTab] = useState<"ingredients" | "nutrition">("ingredients");

  if (isLoading) {
    return (
      <div className="px-8 py-7 max-w-[1320px] mx-auto">
        <div className="h-8 w-32 bg-bg-muted rounded animate-pulse mb-6" />
        <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
          <div className="flex flex-col gap-4">
            <div className="h-6 w-48 bg-bg-muted rounded animate-pulse" />
            <div className="h-16 w-full bg-bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-bg-muted rounded animate-pulse" />
          </div>
          <div className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="px-8 py-7 max-w-[1320px] mx-auto text-center">
        <div className="text-4xl mb-3">🍃</div>
        <h2 className="font-serif text-2xl text-text mb-2">Recipe not found</h2>
        <button onClick={() => navigate({ to: `/g/${groupSlug}` })} className="text-brand hover:text-brand-ink text-sm">
          ← Back to recipes
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <RecipeHero recipe={recipe} onBack={() => navigate({ to: `/g/${groupSlug}` })} />

      <div className="grid gap-8" style={{ gridTemplateColumns: "340px 1fr" }}>
        <div className="bg-surface border border-border rounded-[14px] p-5 sticky top-[80px] self-start">
          <div className="flex border-b border-border mb-4">
            {(["ingredients", "nutrition"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  tab === t ? "border-brand text-text" : "border-transparent text-text-muted hover:text-text"
                }`}>
                {t}
              </button>
            ))}
          </div>
          {tab === "ingredients"
            ? <IngredientsList recipe={recipe} />
            : recipe.nutrition
              ? <NutritionPanel nutrition={recipe.nutrition} />
              : <p className="text-text-muted text-sm">No nutrition data available.</p>
          }
        </div>

        <div>
          {recipe.recipeInstructions?.length ? (
            <StepList steps={recipe.recipeInstructions} />
          ) : (
            <p className="text-text-muted">No instructions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

Open a recipe detail page. Confirm: hero renders with two-column layout (stacked on mobile), ingredients list shows with serving scaler, step list shows with active step highlight, nutrition tab switches correctly.

- [ ] **Step 7: Commit**

```bash
git add src/ && git commit -m "feat: add Recipe Detail page with RecipeHero, IngredientsList, NutritionPanel, StepList"
```

---

## Task 16: Mobile responsive fixes + login redirect

**Files:**
- Modify: `frontend-react/src/routes/__root.tsx`
- Modify: `frontend-react/src/routes/g/$groupSlug/index.tsx`
- Modify: `frontend-react/src/routes/g/$groupSlug/r/$slug/index.tsx`

- [ ] **Step 1: Fix recipe detail hero — stack on mobile**

In `RecipeHero.tsx`, replace the grid div:

```tsx
<div className="grid gap-8 mb-8 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
```

- [ ] **Step 2: Fix recipe detail body — stack on mobile**

In `src/routes/g/$groupSlug/r/$slug/index.tsx`, replace the body grid div:

```tsx
<div className="grid gap-8 grid-cols-1 lg:grid-cols-[340px_1fr]">
```

- [ ] **Step 3: Fix Recipe Filter page — stack on mobile**

In `src/routes/g/$groupSlug/recipes/finder/index.tsx`, replace the layout div:

```tsx
<div className="grid gap-8 grid-cols-1 lg:grid-cols-[300px_1fr] items-start">
```

- [ ] **Step 4: Fix login redirect to use real groupSlug**

In `src/routes/login.tsx`, update the `onSuccess` callback to use the actual groupSlug from `getMe()`:

```tsx
import { getMe } from "@api-client";

// In LoginPage:
<LoginForm onSuccess={async () => {
  const me = await getMe();
  const slug = me.groupSlug ?? "home";
  navigate({ to: `/g/${slug}` });
}} />
```

- [ ] **Step 5: Test on mobile viewport**

In browser DevTools, set viewport to 390px wide. Verify:
- Recipe search: single column grid, filter bar wraps properly
- Recipe detail: hero stacks vertically (image below text), ingredients panel full-width
- Recipe filter: filter panel renders above results
- Bottom tab bar visible on all pages

- [ ] **Step 6: Commit**

```bash
git add src/ && git commit -m "fix: responsive layout for mobile viewports, fix login redirect to use real groupSlug"
```

---

## Task 17: Run full test suite + smoke check

- [ ] **Step 1: Run all tests**

```bash
cd frontend-react && npm run test:run
```

Expected: all tests pass, no failures.

- [ ] **Step 2: Build production bundle**

```bash
cd frontend-react && npm run build
```

Expected: `dist/` created, no TypeScript errors, no build errors.

- [ ] **Step 3: Smoke-check all pages in dev**

With a running Mealie backend (`http://localhost:9000`):

| Page | URL | Verify |
|---|---|---|
| Login | `/login` | Form renders, login works, redirects to recipe search |
| Forgot Password | `/forgot-password` | Card renders, back link works |
| Recipe Search | `/g/{groupSlug}` | Recipe grid loads from API, filter tabs active, time slider filters |
| Recipe Filter | `/g/{groupSlug}/recipes/finder` | All 3 filter sections independent, results update live |
| Recipe Detail | `/g/{groupSlug}/r/{slug}` | Hero two-col, ingredients checkable, step progression works |
| Mobile | any | Bottom tab bar visible, sidebar hidden, no horizontal overflow |

- [ ] **Step 4: Final commit**

```bash
cd frontend-react && git add . && git commit -m "chore: verify full test suite and production build pass"
```
