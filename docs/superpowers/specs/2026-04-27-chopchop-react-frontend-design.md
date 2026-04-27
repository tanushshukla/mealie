# ChopChopPlan — React Frontend Design Spec

**Date:** 2026-04-27  
**Status:** Approved  
**Scope:** v1 — Auth, Recipe Search, Recipe Filter, Recipe Detail

---

## 1. Context & Goals

The existing Mealie-based frontend (Nuxt 4 + Vue + Vuetify) is being replaced with a modern React frontend. The React app lives in `frontend-react/` inside the same repo (a fork of mealie-plus), isolated from the Vue code so upstream Python/API changes can still be cherry-picked cleanly.

**Known bugs being fixed by this rewrite:**
1. Filter ordering dependency on the recipe finder page — tags/categories gated behind ingredient selection
2. Wide-screen truncation on the ingredient table
3. Dated Material Design UI

**Long-term plan:** Full app migration, then React Native mobile apps. The API client layer is structured for React Native code sharing from day one.

---

## 2. Tech Stack

| Layer | Choice | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Build Tool | Vite (Rolldown engine) | 8.0.8 |
| Router | TanStack Router (file-based) | 1.168.24 |
| Data Fetching | TanStack Query | 5.100.5 |
| Styling | Tailwind CSS v4 | 4.2.0 |
| Component Base | shadcn/ui CLI | v4 |
| Validation | Zod (search params + forms) | 4.3.6 |
| Language | TypeScript | latest 5.x |

**Why TanStack Router over React Router:**
- Route params and search params are fully typed end-to-end via Zod schemas
- File-based routing mirrors Expo Router conventions (useful when React Native app starts)
- Built-in route loaders integrate with TanStack Query (prefetch on navigation)
- Same team as TanStack Query — no glue code

**Why Vite 8 over Next.js:**
- App is auth-gated, no SSR/SEO need
- No Node server required, deploys as static files alongside existing backend
- Vite 8's Rolldown engine gives 10-30x faster builds than previous Vite

---

## 3. Directory Structure

```
frontend-react/
├── packages/
│   └── api-client/              # Shared API layer (future React Native reuse)
│       ├── client.ts            # Base fetch wrapper + auth token injection
│       ├── auth.ts              # login(), logout(), getMe()
│       ├── recipes.ts           # listRecipes(), getRecipe(), filterRecipes()
│       └── types.ts             # TypeScript types mirroring Mealie API schemas
│
├── src/
│   ├── routes/                  # TanStack Router file-based routes
│   │   ├── __root.tsx           # Root layout (sidebar + topbar shell)
│   │   ├── login.tsx            # Login page (no layout shell)
│   │   ├── forgot-password.tsx  # Forgot password (no layout shell)
│   │   └── g/
│   │       └── $groupSlug/
│   │           ├── index.tsx              # Recipe search/browse
│   │           ├── recipes/
│   │           │   └── finder/
│   │           │       └── index.tsx      # Recipe filter page
│   │           └── r/
│   │               └── $slug/
│   │                   └── index.tsx      # Recipe detail
│   │
│   ├── components/
│   │   ├── layout/              # Sidebar, Topbar, MobileTabbar, MobileDrawer
│   │   ├── recipe/              # RecipeCard, RecipeGrid, FilterBar, FinderFilters,
│   │   │                        # RecipeHero, IngredientsList, NutritionPanel, StepList
│   │   ├── auth/                # AuthCard, LoginForm
│   │   └── ui/                  # shadcn/ui generated components (Button, Input, etc.)
│   │
│   ├── hooks/                   # useRecipes, useRecipe, useAuth (TanStack Query wrappers)
│   ├── lib/
│   │   ├── query-client.ts      # TanStack Query client config
│   │   └── auth-store.ts        # Token storage (localStorage + memory)
│   └── styles/
│       └── tokens.css           # Design tokens + Tailwind @theme mapping
│
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**React Native sharing model:** `packages/api-client/` contains zero React/DOM dependencies — pure TypeScript with `fetch`. When the React Native project starts, this becomes an npm workspace package (`@chopchop/api-client`) shared by both apps. Custom hooks in `src/hooks/` use TanStack Query which has a React Native package, so those port with minimal changes.

---

## 4. Routing & URL Design

All route search params are defined as Zod schemas. TanStack Router validates on load — a malformed URL degrades gracefully, never crashes.

```
/login
  No params. Redirects to /g/$groupSlug on success.

/forgot-password
  No params.

/g/$groupSlug
  search: {
    q?:           string      // free-text search
    tags?:        string[]    // tag filter (multi-select)
    categories?:  string[]    // category filter (multi-select)
    page?:        number      // pagination
  }
  → Recipe search/browse page

/g/$groupSlug/recipes/finder
  search: {
    tags?:        string[]    // tag filter (independent)
    categories?:  string[]    // category filter (independent)
    foods?:       string[]    // ingredient/food filter (independent)
    cookTime?:    number      // max cook time in minutes
  }
  → Recipe filter page (all dimensions independent — fixes ordering bug)

/g/$groupSlug/r/$slug
  No search params.
  → Recipe detail
```

URL scheme matches existing Mealie URL structure exactly — no backend nginx changes required.

---

## 5. Page Designs

### 5.1 Auth Pages (Login + Forgot Password)

- Separate root layout: no sidebar, full-height centered card on paper-50 background
- `AuthCard`: white surface card, brand logo + name at top, form below
- `LoginForm`: email field, password field, "Forgot password?" link, primary submit button, inline error state (wrong credentials, locked out)
- Auth calls `POST /api/auth/token`, stores `access_token` in localStorage, redirects to `/g/$groupSlug`
- OIDC/OAuth: not in v1

### 5.2 Recipe Search (`/g/$groupSlug`)

Matches prototype Recipes view design:

- Large serif heading: *"A small library of good things."*
- `FilterBar` below heading:
  - Horizontal scrollable pill tabs (All + live API tags) — active = dark fill
  - Season dropdown + time slider on the right
  - Grid/list view toggle
- `SearchInput` in Topbar drives `?q=` URL param
- Result count line: "**14** recipes · sorted by recently added"
- `RecipeGrid`: 4 col desktop → 2 col tablet → 1 col mobile
- Each `RecipeCard`: 4:3 image, time pill overlay, bookmark button, tags, serif title, chef + rating

### 5.3 Recipe Filter (`/g/$groupSlug/recipes/finder`)

Fixes the filter ordering bug: all filter dimensions are independent pill selectors — selecting any one never gates another.

- Serif heading: *"Find something to make."*
- Three independent filter sections (each a collapsible pill group):
  - **Tags** — multi-select pills, loaded from API
  - **Categories** — multi-select pills, loaded from API
  - **Ingredients/Foods** — multi-select pills with search input, loaded from API
- **Cook time** slider at bottom of filters
- Filter state lives in URL search params (shareable, bookmarkable)
- Results grid updates live as params change (TanStack Query with param-keyed queries)
- Empty state: illustrated card prompting to broaden filters

### 5.4 Recipe Detail (`/g/$groupSlug/r/$slug`)

Matches prototype RecipeDetail design:

**Hero section** (two-column, stacks on mobile):
- Left: tags chips, large serif title, "By Chef · serves N" byline, stat row (Time / Difficulty / Calories / Rating), action buttons (Start cooking, Save, ⋯ menu). "Add missing to list" is v2 — requires shopping list API.
- Right: full-bleed recipe image

**Body section** (two-column on desktop, stacked on mobile):
- Left panel (`IngredientsList`): serving scaler stepper, checkable ingredient rows, Nutrition tab (pantry hint "You have X of N ingredients" is v2 — requires pantry API)
- Right panel (`StepList`): numbered steps, active step highlight with Done + Set timer actions, completed steps show check mark

**Nutrition tab content**: macro bar chart (Fat/Carbs/Protein), detail table (sat fat, sugar, fibre, sodium), disclaimer

**Related recipes strip**: "Goes well alongside" — 4-col `RecipeGrid` at bottom

---

## 6. Layout Shell

```
Desktop (≥1024px):   240px sidebar | main content area
Tablet (768–1023px): 72px icon-only sidebar | main content area
Mobile (<768px):     No sidebar. Bottom tab bar (5 tabs). Hamburger → slide-out drawer overlay.
```

Auth routes (`/login`, `/forgot-password`) use a separate layout root — no sidebar, centered card.

**Sidebar contents:**
- Brand mark + "ChopChop*Plan*" serif name
- "+ New recipe" primary button
- Nav sections: Cook (Home, Recipes, Recipe Finder, Meal Planner, Shopping List, Calendar), Library (Pantry, Cookbooks, Settings)
- User block at bottom (avatar initials, name, group name)

**Topbar:**
- Eyebrow text (e.g., "Library") + serif page title
- Search input (pill shape, ⌘K hint) — drives `?q=` param on recipe search page
- Theme toggle (sun/moon icon)
- Notifications icon
- User avatar

---

## 7. Theming

The prototype's CSS custom properties map into Tailwind v4's `@theme {}` block in `tokens.css`. Tailwind v4 drops `tailwind.config.ts` — all token config is CSS-native.

```css
/* tokens.css */
@import "tailwindcss";

/* Paste prototype :root block here (sage palette, cream, paper, shadows, radii, fonts) */
:root {
  --sage-600: #426634;
  /* ... all prototype tokens ... */
  --brand: var(--sage-600);
  --surface: #ffffff;
  /* etc */
}

/* Map prototype tokens into Tailwind utility classes */
@theme {
  --color-brand:        var(--brand);
  --color-brand-soft:   var(--brand-soft);
  --color-brand-ink:    var(--brand-ink);
  --color-brand-fg:     var(--brand-fg);
  --color-surface:      var(--surface);
  --color-bg:           var(--bg);
  --color-bg-elev:      var(--bg-elev);
  --color-bg-sunken:    var(--bg-sunken);
  --color-border:       var(--border);
  --color-border-strong:var(--border-strong);
  --color-text:         var(--text);
  --color-text-muted:   var(--text-muted);
  --color-text-dim:     var(--text-dim);
  --color-accent:       var(--accent);
  --color-accent-ink:   var(--accent-ink);
  --color-danger:       var(--tomato);

  --font-serif: "Fraunces", "Source Serif 4", Georgia, serif;
  --font-sans:  "Inter Tight", "Inter", system-ui, sans-serif;
  --font-mono:  "JetBrains Mono", ui-monospace, monospace;

  --radius-sm:   8px;
  --radius:      14px;
  --radius-lg:   22px;
  --radius-pill: 9999px;
}
```

Dark mode: `[data-theme="dark"]` attribute on `<html>`, toggled by theme button in Topbar. Tailwind dark: variant not needed — the CSS vars handle it.

Class usage examples: `text-brand`, `bg-surface`, `border-border`, `font-serif`, `rounded-pill`.

---

## 8. API Client Layer

```typescript
// packages/api-client/client.ts
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T>
// — reads token from storage, injects Authorization header
// — throws typed ApiError on non-2xx

// packages/api-client/auth.ts
login(email: string, password: string): Promise<{ access_token: string }>
getMe(): Promise<User>

// packages/api-client/recipes.ts
listRecipes(groupSlug: string, params: RecipeListParams): Promise<PaginatedRecipes>
getRecipe(groupSlug: string, slug: string): Promise<Recipe>
filterRecipes(groupSlug: string, params: RecipeFilterParams): Promise<PaginatedRecipes>
```

TanStack Query keys are defined as constants co-located in hook files (`src/hooks/`). Components call hooks only — never `apiFetch` directly.

**Auth state:** Token stored in `localStorage`. On app boot, `__root.tsx` loader checks for token; if missing, redirects to `/login`. TanStack Query's global `onError` intercepts 401s, clears token, redirects to `/login`. `getMe()` result is a TanStack Query query that provides user data across the app.

---

## 9. Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| < 768px | Mobile: no sidebar, bottom tab bar |
| 768–1023px | Tablet: 72px icon sidebar |
| ≥ 1024px | Desktop: 240px full sidebar |

Recipe grid: 4 col (≥1280px) → 3 col (1024–1279px) → 2 col (768–1023px) → 1 col (<768px)

---

## 10. Out of Scope (v1)

- Pantry-based ingredient % match finder (v2)
- OIDC / OAuth login
- Meal planner, shopping list, calendar, cookbooks, pantry pages
- Recipe create / edit
- Recipe import from URL
- Dark mode persistence (token is in CSS, toggle works; persistence via localStorage is v2)
