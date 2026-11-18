import Link from "next/link";
import { Archive, BookOpen, CalendarDays, Check, ChevronRight } from "lucide-react";
import { GroceriesIllustration } from "@/components/illustrations";

type Step = {
  href: string;
  title: string;
  body: string;
  icon: typeof Archive;
  done: boolean;
};

/** First-run guide shown on the dashboard until a household is set up. */
export function WelcomeCard({
  pantryDone,
  planDone,
}: {
  pantryDone: boolean;
  planDone: boolean;
}) {
  const steps: Step[] = [
    {
      href: "/pantry",
      title: "Stock your pantry",
      body: "Add what's in your cupboards, or snap a photo of a shelf.",
      icon: Archive,
      done: pantryDone,
    },
    {
      href: "/recipes",
      title: "Find some recipes",
      body: "Browse the collection or import your own from a link or photo.",
      icon: BookOpen,
      done: planDone,
    },
    {
      href: "/planner",
      title: "Plan your week",
      body: "Pick meals for the next few days and we'll build your shopping list.",
      icon: CalendarDays,
      done: planDone,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="animate-fade-in-up mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">Welcome to PantryPilot</h2>
          <p className="text-sm text-muted">
            Three quick steps to get your household going ({doneCount} of {steps.length} done).
          </p>
        </div>
        <GroceriesIllustration className="hidden h-16 w-32 shrink-0 sm:block" />
      </div>
      <ol className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex h-full items-start gap-3 px-5 py-4 transition-colors hover:bg-background/60"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step.done
                      ? "bg-brand text-brand-foreground"
                      : "border border-brand/30 bg-brand/10 text-brand-dark"
                  }`}
                >
                  {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon className="h-4 w-4 text-brand" />
                    <span className={step.done ? "text-muted line-through" : ""}>{step.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{step.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
