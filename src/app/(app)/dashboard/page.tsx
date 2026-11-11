import Link from "next/link";
import {
  ChevronRight,
  Utensils,
  ShoppingCart,
  AlertTriangle,
  CalendarClock,
  Snowflake,
  Trash2,
} from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { expiryStatus } from "@/lib/expiry";
import type { MealBatch, MealPlanEntry, PantryItem } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const { profile, household } = await getCurrentHousehold();
  const supabase = await createClient();
  const today = todayIso();
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 6);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [todayMeals, upcomingMeals, pantryItems, shoppingItems, batches, wasteRows] =
    await Promise.all([
    supabase
      .from("meal_plan_entries")
      .select("*, recipes(name)")
      .eq("household_id", household.id)
      .eq("plan_date", today),
    supabase
      .from("meal_plan_entries")
      .select("*, recipes(name)")
      .eq("household_id", household.id)
      .gt("plan_date", today)
      .lte("plan_date", weekAhead.toISOString().slice(0, 10))
      .order("plan_date")
      .limit(6),
    supabase.from("pantry_items").select("*").eq("household_id", household.id),
    supabase
      .from("shopping_list_items")
      .select("*")
      .eq("household_id", household.id)
      .eq("ticked", false)
      .gt("to_buy_qty", 0),
    supabase
      .from("meal_batches")
      .select("*")
      .eq("household_id", household.id)
      .gt("portions_remaining", 0)
      .order("cooked_date", { ascending: false }),
    supabase
      .from("pantry_stock_history")
      .select("id")
      .eq("household_id", household.id)
      .eq("change_type", "waste")
      .gte("created_at", monthStart.toISOString()),
  ]);

  const allPantryItems = (pantryItems.data as PantryItem[] | null) ?? [];
  const expiredItems = allPantryItems.filter((p) => expiryStatus(p.expiry_date) === "expired");
  const soonItems = allPantryItems.filter((p) => expiryStatus(p.expiry_date) === "soon");
  const wastedThisMonth = wasteRows.data?.length ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Hi {profile.display_name ?? "there"} 👋
      </h1>
      <p className="mb-6 text-sm text-muted">{household.name}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Today's meals" href="/planner" icon={Utensils}>
          {todayMeals.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(todayMeals.data as MealPlanEntry[]).map((m) => (
                <li key={m.id}>
                  <span className="capitalize text-muted">{m.meal_slot}:</span>{" "}
                  {m.recipes?.name}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine text="Nothing planned for today" />
          )}
        </Card>

        <Card title="Shopping list" href="/shopping-list" icon={ShoppingCart}>
          {shoppingItems.data?.length ? (
            <p className="text-sm">
              <span className="font-medium">{shoppingItems.data.length}</span> item
              {shoppingItems.data.length === 1 ? "" : "s"} still to buy
            </p>
          ) : (
            <EmptyLine text="Shopping list is clear" />
          )}
        </Card>

        <Card title="Use soon" href="/pantry" icon={AlertTriangle}>
          {expiredItems.length || soonItems.length ? (
            <ul className="space-y-1 text-sm">
              {expiredItems.slice(0, 5).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.ingredient_name}</span>
                  <span className="font-medium text-danger">Expired {p.expiry_date}</span>
                </li>
              ))}
              {soonItems.slice(0, 5 - Math.min(expiredItems.length, 5)).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.ingredient_name}</span>
                  <span className="text-warn">Use by {p.expiry_date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine text="Nothing expiring soon" />
          )}
        </Card>

        <Card title="Coming up" href="/planner" icon={CalendarClock}>
          {upcomingMeals.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(upcomingMeals.data as MealPlanEntry[]).map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span>{m.recipes?.name}</span>
                  <span className="text-muted">{m.plan_date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine text="Plan your next few days" />
          )}
        </Card>

        <Card title="Batch-cooked meals" href="/batches" icon={Snowflake}>
          {batches.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(batches.data as MealBatch[]).slice(0, 5).map((b) => (
                <li key={b.id} className="flex justify-between">
                  <span>{b.recipe_name}</span>
                  <span className="text-muted">
                    {b.portions_remaining} of {b.portions_total} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine text="Nothing batch-cooked yet" />
          )}
        </Card>

        <Card title="Food waste" href="/pantry/waste" icon={Trash2}>
          {wastedThisMonth > 0 ? (
            <p className="text-sm">
              <span className="font-medium">{wastedThisMonth}</span> item
              {wastedThisMonth === 1 ? "" : "s"} wasted this month
            </p>
          ) : (
            <EmptyLine text="No waste logged this month" />
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  href: string;
  icon: typeof Utensils;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-medium text-brand hover:text-brand-dark"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}
