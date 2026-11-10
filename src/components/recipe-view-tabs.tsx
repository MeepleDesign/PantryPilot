import Link from "next/link";

export function RecipeViewTabs({ active }: { active: "mine" | "community" }) {
  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface p-1 text-sm">
      <Link
        href="/recipes"
        className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors ${
          active === "mine" ? "bg-brand/10 text-brand-dark" : "text-muted hover:text-foreground"
        }`}
      >
        My Recipes
      </Link>
      <Link
        href="/recipes/community"
        className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors ${
          active === "community" ? "bg-brand/10 text-brand-dark" : "text-muted hover:text-foreground"
        }`}
      >
        Community
      </Link>
    </div>
  );
}
