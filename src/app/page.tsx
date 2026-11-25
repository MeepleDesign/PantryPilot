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
  Sparkles,
  Scale,
  Check,
  Minus,
  ArrowRight,
} from "lucide-react";

const STEPS: { title: string; body: string; image: string; alt: string }[] = [
  {
    title: "Collect your recipes",
    body: "Type them in, paste a link, or snap a cookbook page.",
    image: "/screenshots/recipes.png",
    alt: "PantryPilot recipe library with filters and saved recipes",
  },
  {
    title: "Plan the week",
    body: "Build a week of meals in a minute. Swap any day you don't fancy.",
    image: "/screenshots/planner.png",
    alt: "PantryPilot meal planner showing a week of meals",
  },
  {
    title: "Shop only for what's missing",
    body: "Your list writes itself — minus what's already in the cupboard.",
    image: "/screenshots/shopping-list.png",
    alt: "PantryPilot shopping list built from the meal plan",
  },
];

const BENEFITS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "🥕",
    title: "Use what you've got",
    body: "Get recipe ideas built around your pantry — starting with whatever's about to turn.",
  },
  {
    emoji: "⏰",
    title: "Catch it before it expires",
    body: "Use-soon warnings mean fewer forgotten bags of spinach.",
  },
  {
    emoji: "🍲",
    title: "Cook once, eat all week",
    body: "Freeze a batch, log the portions, and always know what's ready to reheat.",
  },
  {
    emoji: "🧾",
    title: "One shop, no repeats",
    body: "No more buying a third jar of cumin. The list knows what you've got.",
  },
];

const FEATURES = [
  { icon: BookOpen, title: "Recipe library", body: "All your recipes in one place, filterable by cuisine, course and rating." },
  { icon: Camera, title: "Web & photo import", body: "Paste any recipe link, or photograph a page and let AI do the typing." },
  { icon: CalendarDays, title: "Meal planner", body: "Generate a week, preview it, then tweak it one day at a time." },
  { icon: Sparkles, title: "Recipe suggestions", body: "See what you can cook right now from what's on your shelves." },
  { icon: Scale, title: "Smart scaling", body: "Cooking for two or ten? Ingredients scale with the servings." },
  { icon: Archive, title: "Pantry tracking", body: "Cupboard, fridge and freezer — with expiry dates and alerts." },
  { icon: ShoppingCart, title: "Shopping lists", body: "Built from your plan, with an estimated cost, shared with your household." },
  { icon: Snowflake, title: "Batch cooking", body: "Track frozen and fridged portions down to the last one." },
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

const PRIMARY_CTA =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold shadow-sm";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight">PantryPilot</span>
        </div>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:block">
            How it works
          </a>
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:block">
            Features
          </a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:block">
            Pricing
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-surface">
            Sign in
          </Link>
          <LinkButton
            href="/login?mode=signup"
            className="rounded-lg bg-brand px-4 py-2 font-medium text-brand-foreground shadow-sm hover:bg-brand-dark"
          >
            Get started
          </LinkButton>
        </nav>
      </header>

      {/* Hero: food photo + solid brand CTA block, then the real app below */}
      <section className="mx-auto max-w-6xl px-4 pt-2 md:px-8 md:pt-4">
        <div className="grid overflow-hidden rounded-2xl shadow-lg md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
            <Image
              src="/recipe-images/vegetable-tagine.jpg"
              alt="A colourful vegetable tagine ready to serve"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-brand px-6 py-10 text-brand-foreground md:px-12 md:py-14">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Know what&rsquo;s for dinner. All week.
            </h1>
            <p className="mt-5 text-base opacity-90 md:text-lg">
              Plan meals, track your pantry and get a shopping list that writes itself. Less waste,
              fewer takeaways.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton
                href="/login?mode=signup"
                className={`${PRIMARY_CTA} bg-surface text-foreground hover:bg-background`}
              >
                Create a free account
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <a
                href="#how-it-works"
                className={`${PRIMARY_CTA} border border-brand-foreground/40 shadow-none hover:bg-brand-foreground/10`}
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-sm opacity-80">
              Free to use · Works on phone, tablet and desktop
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl md:mt-16">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-muted">
            The real app — not a mock-up
          </p>
          <BrowserFrame
            src="/screenshots/dashboard.png"
            alt="PantryPilot dashboard showing today's meals, use-soon pantry items, shopping list and batch-cooked meals"
            priority
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 md:px-8 md:py-28">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Three steps to a sorted week
        </h2>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                {/* Zoomed crop: hide the app sidebar so the screen's content is legible */}
                <div className="absolute inset-y-0 -left-[26%] w-[150%]">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 150vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1 text-muted">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <CtaBanner
        title="Dinner, decided."
        body="Set up your first week in about the time it takes to scroll a takeaway menu."
      />

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Why households use PantryPilot
        </h2>
        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4">
              <span aria-hidden className="text-4xl leading-none">
                {b.emoji}
              </span>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-1.5 text-muted">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature breadth */}
      <section id="features" className="scroll-mt-6 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything your kitchen needs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted md:text-lg">
              Not just a recipe box. Not just a list. The whole loop, in one app.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">See it in action</h2>
          <p className="mt-3 text-muted md:text-lg">The screens your household will actually use.</p>
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
              <div>
                <h3 className="mb-2 text-2xl font-semibold tracking-tight">{item.title}</h3>
                <p className="text-muted md:text-lg">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-2xl scroll-mt-6 px-4 pb-20 md:px-8 md:pb-28">
        <h2 className="mb-2 text-center text-3xl font-bold tracking-tight md:text-4xl">Pricing</h2>
        <p className="mb-8 text-center text-muted">
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
      </section>

      <CtaBanner title="Start planning tonight." body="Free account. Set up in minutes." />

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted sm:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <ChefHat className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium text-foreground">PantryPilot</span>
        </div>
        <span>© {new Date().getFullYear()} PantryPilot</span>
      </footer>
    </div>
  );
}

function CtaBanner({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="rounded-2xl bg-brand px-6 py-12 text-center text-brand-foreground md:py-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg opacity-90 md:text-lg">{body}</p>
        <LinkButton
          href="/login?mode=signup"
          className={`${PRIMARY_CTA} mt-7 bg-surface text-foreground hover:bg-background`}
        >
          Create a free account
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </section>
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
