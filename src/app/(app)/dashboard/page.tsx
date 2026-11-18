import Link from "next/link";
import {
  ChevronRight,
  Utensils,
  ShoppingCart,
  AlertTriangle,
  CalendarClock,
  Snowflake,
  Trash2,
  Receipt,
  Archive,
} from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { expiryStatus } from "@/lib/expiry";
import { formatMoney } from "@/lib/currency";
import { format } from "date-fns";
import { formatShortDate } from "@/lib/format-date";
import { EmptyState } from "@/components/empty-state";
import { KitchenIllustration } from "@/components/illustrations";
import { WelcomeCard } from "@/components/welcome-card";
import { getKeyIngredientStatuses } from "@/lib/actions/key-ingredients";
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

  const weekStart = new Date();
  const dayOfWeek = (weekStart.getDay() + 6) % 7; // Monday = 0
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const [
    todayMeals,
    upcomingMeals,
    pantryItems,
    shoppingItems,
    batches,
    wasteRows,
    spendRows,
    weekSpendRows,
    keyIngredients,
  ] = await Promise.all([
    supabase
      .from("meal_plan_entries")
      .select(
        "*, recipes(name), batch:meal_batches!meal_plan_entries_batch_id_fkey(recipe_name)",
      )
      .eq("household_id", household.id)
      .eq("plan_date", today),
    supabase
      .from("meal_plan_entries")
      .select(
        "*, recipes(name), batch:meal_batches!meal_plan_entries_batch_id_fkey(recipe_name)",
      )
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
    supabase
      .from("receipt_scans")
      .select("receipt_items(price)")
      .eq("household_id", household.id)
      .gte("purchased_at", monthStart.toISOString().slice(0, 10)),
    supabase
      .from("receipt_scans")
      .select("receipt_items(price)")
      .eq("household_id", household.id)
      .gte("purchased_at", weekStart.toISOString().slice(0, 10)),
    getKeyIngredientStatuses(),
  ]);

  const allPantryItems = (pantryItems.data as PantryItem[] | null) ?? [];
  const expiredItems = allPantryItems.filter((p) => expiryStatus(p.expiry_date) === "expired");
  const soonItems = allPantryItems.filter((p) => expiryStatus(p.expiry_date) === "soon");
  const wastedThisMonth = wasteRows.data?.length ?? 0;
  const spentThisMonth = (
    (spendRows.data as { receipt_items: { price: number }[] }[] | null) ?? []
  ).reduce((sum, scan) => sum + scan.receipt_items.reduce((s, i) => s + Number(i.price), 0), 0);
  const spentThisWeek = (
    (weekSpendRows.data as { receipt_items: { price: number }[] }[] | null) ?? []
  ).reduce((sum, scan) => sum + scan.receipt_items.reduce((s, i) => s + Number(i.price), 0), 0);

  const keyIngredientAlerts = keyIngredients.filter((k) => k.status !== "ok");

  const hasPlannedMeals = Boolean(todayMeals.data?.length || upcomingMeals.data?.length);
  const todayMeal = (todayMeals.data as MealPlanEntry[] | null)?.[0];
  const useSoonCount = expiredItems.length + soonItems.length;
  const toBuyCount = shoppingItems.data?.length ?? 0;
  const hasQuickFacts =
    Boolean(todayMeal) ||
    useSoonCount > 0 ||
    toBuyCount > 0 ||
    spentThisWeek > 0 ||
    keyIngredientAlerts.length > 0;
  const showWelcome =
    (allPantryItems.length === 0 || !hasPlannedMeals) &&
    !batches.data?.length &&
    spentThisMonth === 0 &&
    !shoppingItems.data?.length;

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/10 via-surface to-accent/10 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
          {format(new Date(), "EEEE d MMMM")}
        </p>
        <h1 className="relative mt-1 max-w-[65%] text-2xl font-semibold tracking-tight sm:max-w-none">
          Hi {profile.display_name ?? "there"} 👋
        </h1>
        <p className="relative mt-0.5 text-sm text-muted">{household.name}</p>
        {hasQuickFacts && (
          <div className="relative mt-3 flex max-w-[75%] flex-wrap gap-1.5 sm:max-w-[55%]">
            {todayMeal && (
              <Link
                href="/planner"
                className="flex items-center gap-1 rounded-full border border-brand/20 bg-surface/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-surface"
              >
                <span className="capitalize text-muted">{todayMeal.meal_slot}:</span>
                <span className="min-w-0 truncate">
                  {todayMeal.recipes?.name ?? todayMeal.batch?.recipe_name}
                </span>
              </Link>
            )}
            {useSoonCount > 0 && (
              <Link
                href="/pantry"
                className="flex items-center gap-1 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-xs font-medium text-warn backdrop-blur-sm transition-colors hover:bg-warn/20"
              >
                {useSoonCount} to use soon
              </Link>
            )}
            {toBuyCount > 0 && (
              <Link
                href="/shopping-list"
                className="flex items-center gap-1 rounded-full border border-brand/20 bg-surface/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-surface"
              >
                {toBuyCount} to buy
              </Link>
            )}
            {spentThisWeek > 0 && (
              <Link
                href="/shopping-list/spending"
                className="flex items-center gap-1 rounded-full border border-brand/20 bg-surface/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-surface"
              >
                {formatMoney(spentThisWeek, profile.region)} this week
              </Link>
            )}
            {keyIngredientAlerts.length > 0 && (
              <Link
                href="/pantry"
                className="flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger backdrop-blur-sm transition-colors hover:bg-danger/20"
              >
                {keyIngredientAlerts.length} key ingredient
                {keyIngredientAlerts.length === 1 ? "" : "s"} need attention
              </Link>
            )}
          </div>
        )}
        <KitchenIllustration className="pointer-events-none absolute -bottom-1 right-1 h-14 w-24 opacity-90 sm:-bottom-2 sm:right-6 sm:h-28 sm:w-48 sm:opacity-100" />
      </section>

      {showWelcome && (
        <WelcomeCard pantryDone={allPantryItems.length > 0} planDone={hasPlannedMeals} />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Today's meals" href="/planner" icon={Utensils}>
          {todayMeals.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(todayMeals.data as MealPlanEntry[]).map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-dark">
                    {m.meal_slot}
                  </span>
                  <span className="min-w-0 truncate">{m.recipes?.name ?? m.batch?.recipe_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Utensils} title="Nothing planned for today" body="Add a meal from the planner." compact />
          )}
        </Card>

        <Card title="Shopping list" href="/shopping-list" icon={ShoppingCart}>
          {shoppingItems.data?.length ? (
            <BigStat
              value={shoppingItems.data.length}
              label={`item${shoppingItems.data.length === 1 ? "" : "s"} still to buy`}
            />
          ) : (
            <EmptyState icon={ShoppingCart} title="Shopping list is clear" compact />
          )}
        </Card>

        <Card title="Pantry" href="/pantry" icon={Archive}>
          {allPantryItems.length > 0 ? (
            <BigStat
              value={allPantryItems.length}
              label={`item${allPantryItems.length === 1 ? "" : "s"} tracked`}
            />
          ) : (
            <EmptyState icon={Archive} title="Your pantry is empty" body="Add what you have to get started." compact />
          )}
        </Card>

        <Card title="Use soon" href="/pantry" icon={AlertTriangle}>
          {expiredItems.length || soonItems.length ? (
            <ul className="space-y-1 text-sm">
              {expiredItems.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{p.ingredient_name}</span>
                  <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                    Expired {formatShortDate(p.expiry_date)}
                  </span>
                </li>
              ))}
              {soonItems.slice(0, 5 - Math.min(expiredItems.length, 5)).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{p.ingredient_name}</span>
                  <span className="shrink-0 rounded-full bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
                    Use by {formatShortDate(p.expiry_date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={AlertTriangle} title="Nothing expiring soon" compact />
          )}
        </Card>

        <Card title="Coming up" href="/planner" icon={CalendarClock}>
          {upcomingMeals.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(upcomingMeals.data as MealPlanEntry[]).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{m.recipes?.name ?? m.batch?.recipe_name}</span>
                  <span className="shrink-0 text-xs text-muted">{formatShortDate(m.plan_date, true)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarClock} title="Plan your next few days" compact />
          )}
        </Card>

        <Card title="Batch-cooked meals" href="/batches" icon={Snowflake}>
          {batches.data?.length ? (
            <ul className="space-y-1 text-sm">
              {(batches.data as MealBatch[]).slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{b.recipe_name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {b.portions_remaining} portion{b.portions_remaining === 1 ? "" : "s"} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Snowflake} title="Nothing batch-cooked yet" compact />
          )}
        </Card>

        <Card title="Food waste" href="/pantry/waste" icon={Trash2}>
          {wastedThisMonth > 0 ? (
            <BigStat
              value={wastedThisMonth}
              label={`item${wastedThisMonth === 1 ? "" : "s"} wasted this month`}
            />
          ) : (
            <EmptyState icon={Trash2} title="No waste logged this month" compact />
          )}
        </Card>

        <Card title="Spending" href="/shopping-list/spending" icon={Receipt}>
          {spentThisMonth > 0 ? (
            <BigStat value={formatMoney(spentThisMonth, profile.region)} label="spent this month" />
          ) : (
            <EmptyState icon={Receipt} title="No spend tracked this month" body="Scan a receipt to start." compact />
          )}
        </Card>
      </div>
    </div>
  );
}

function BigStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </p>
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
    <div className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
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
