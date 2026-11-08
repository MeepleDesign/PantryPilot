export type StorageLocation = "cupboard" | "fridge" | "freezer" | "other";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type Recipe = {
  id: string;
  household_id: string | null;
  name: string;
  description: string | null;
  cuisine: string | null;
  diet: string | null;
  protein_tag: string | null;
  main_protein_source: string | null;
  total_time_minutes: number | null;
  servings: number;
  equipment: string | null;
  method: string | null;
  source: "seed" | "manual" | "photo";
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  nutrition_note: string | null;
  image_url: string | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  notes: string | null;
  sort_order: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};

export type MealPlanEntry = {
  id: string;
  household_id: string;
  plan_date: string;
  meal_slot: MealSlot;
  recipe_id: string;
  batch_multiplier: number;
  cooked: boolean;
  cooked_at: string | null;
  recipes?: Recipe;
};

export type PantryItem = {
  id: string;
  household_id: string;
  ingredient_name: string;
  storage_location: StorageLocation;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
  source: "manual" | "photo";
  notes: string | null;
  updated_at: string;
};

export type ShoppingListItem = {
  id: string;
  household_id: string;
  ingredient_name: string;
  unit: string | null;
  needed_qty: number;
  pantry_qty: number;
  to_buy_qty: number;
  ticked: boolean;
  is_manual: boolean;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  default_household_id: string | null;
  dietary_preference: string | null;
  disliked_ingredients: string[];
  units: string;
};

export type Household = {
  id: string;
  name: string;
  default_supermarket: string | null;
  invite_code: string;
};
