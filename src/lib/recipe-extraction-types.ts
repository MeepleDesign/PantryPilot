import type { RecipeCourse } from "@/lib/types";

/** Common shape produced by any recipe-import source (photo via AI, or website URL via parsing). */
export type ExtractedRecipe = {
  name: string;
  description: string | null;
  cuisine: string | null;
  total_time_minutes: number | null;
  servings: number;
  course: RecipeCourse;
  equipment: string | null;
  steps: string[];
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  tags: string[];
  image_url: string | null;
  ingredients: { ingredient_name: string; quantity: number | null; unit: string | null }[];
  low_confidence_fields: string[];
};
