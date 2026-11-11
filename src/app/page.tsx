import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import {
  ChefHat,
  BookOpen,
  CalendarDays,
  Archive,
  ShoppingCart,
  Snowflake,
  Camera,
  Check,
  Minus,
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen, title: "Recipe library", body: "Save your own recipes, import any from a web link, or snap a photo of a cookbook page." },
  { icon: CalendarDays, title: "Meal planner", body: "Plan your week, preview it before it goes live, and swap out any day you don't fancy." },
  { icon: Archive, title: "Pantry tracking", body: "Know what you've got, get warned before it expires, and see what's being wasted." },
  { icon: ShoppingCart, title: "Shopping lists", body: "Built automatically from your plan and what's already in the pantry." },
  { icon: Snowflake, title: "Batch cooking", body: "Log portions you've frozen or fridged, and track them down as you eat them." },
  { icon: Camera, title: "AI photo import", body: "Photograph a recipe or a pantry shelf and let PantryPilot do the typing." },
];

const PLAN_FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: "Unlimited recipes, pantry & shopping list", free: true, pro: true },
  { label: "Meal planner & batch-cook portion tracking", free: true, pro: true },
  { label: "Import recipes from any website", free: true, pro: true },
  { label: "AI recipe photo import", free: false, pro: true },
  { label: "AI pantry photo scan", free: false, pro: true },
  { label: "Community recipe library", free: false, pro: true },
];

const SHOWCASE: {
  title: string;
  body: string;
  image: string;
  alt: string;
}[] = [
  {
    title: "Plan your week, then let it cook",
    body: "Generate a full week from your preferences, preview every meal before it's saved, and swap out anything that doesn't appeal — one day at a time.",
    image: "/screenshots/planner.png",
    alt: "PantryPilot meal planner showing a week of planned dinners and lunches",
  },
  {
    title: "Know what's in your kitchen",
    body: "Track every shelf, get warned before things expire, and turn your plan into a shopping list that already accounts for what you've got.",
    image: "/screenshots/pantry.png",
    alt: "PantryPilot pantry view grouped by cupboard, fridge and freezer",
  },
  {
    title: "Build your recipe library",
    body: "Save your own recipes, pull one in from any website, or photograph a cookbook page — then filter by cuisine, diet or what you can make right now.",
    image: "/screenshots/recipes.png",
    alt: "PantryPilot recipes page with filters and a grid of saved recipes",
  },
  {
    title: "Batch cook without losing track",
    body: "Log portions as you freeze or fridge them, and watch the count come down as your household works through them.",
    image: "/screenshots/batches.png",
    alt: "PantryPilot batch-cooked meals view with portions remaining",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight">PantryPilot</span>
        </div>
        <Link
          href="/login"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Sign in
        </Link>
      </header>

      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_at_top,theme(colors.brand/12%),transparent_65%)]"
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Meal planning that actually fits in your fridge
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted md:text-lg">
              Plan your week, track your pantry, and generate a shopping list automatically —
              built for households who are fed up with wasted food and last-minute takeaways.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <LinkButton
                href="/login?mode=signup"
                className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand-dark"
              >
                Create a free account
              </LinkButton>
              <Link
                href="/login"
                className="rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-surface"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <BrowserFrame
              src="/screenshots/dashboard.png"
              alt="PantryPilot dashboard showing today's meals, use-soon pantry items, shopping list and batch-cooked meals"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mb-1 font-medium">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">See it in action</h2>
          <p className="mt-2 text-sm text-muted md:text-base">
            A quick look at the screens your household will actually use.
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {SHOWCASE.map((item, i) => (
            <div
              key={item.title}
              className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <BrowserFrame src={item.image} alt={item.alt} />
              <div className={i % 2 === 1 ? "md:text-right" : ""}>
                <h3 className="mb-2 text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-20 md:px-8">
        <h2 className="mb-1 text-center text-2xl font-semibold tracking-tight">Pricing</h2>
        <p className="mb-6 text-center text-sm text-muted">
          Free to start. Pro adds AI-powered import tools and the community recipe library.
        </p>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Free</th>
                <th className="px-4 py-3 text-center font-medium">Pro</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((f) => (
                <tr key={f.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{f.label}</td>
                  <td className="px-4 py-3 text-center">
                    {f.free ? (
                      <Check className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-muted" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.pro ? (
                      <Check className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-muted" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Pro plan pricing is coming soon — everything is free to use while we finish it.
        </p>

        <div className="mt-8 text-center">
          <LinkButton
            href="/login?mode=signup"
            className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand-dark"
          >
            Create a free account
          </LinkButton>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted md:px-8">
        © {new Date().getFullYear()} PantryPilot
      </footer>
    </div>
  );
}

function BrowserFrame({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-border bg-background px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={900}
        priority={priority}
        className="h-auto w-full"
        sizes="(min-width: 768px) 50vw, 100vw"
      />
    </div>
  );
}
