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

export type PlanEntryType = "breakfast" | "lunch" | "dinner" | "side" | "snack" | "drink" | "dessert";

export interface PlanEntry {
  id: string;
  date: string;
  entryType: PlanEntryType;
  title?: string | null;
  text?: string | null;
  recipeId?: string | null;
  groupId?: string | null;
  householdId?: string | null;
  recipe?: RecipeSummary | null;
}

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  checked: boolean;
  position: number;
  display?: string | null;
  note?: string | null;
  quantity?: number | null;
  food?: { name: string } | null;
  unit?: { name: string; abbreviation?: string } | null;
  label?: { name: string; color?: string } | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  listItems: ShoppingListItem[];
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
