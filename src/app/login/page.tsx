import { signIn, signUp } from "./actions";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { GroceriesIllustration } from "@/components/illustrations";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-brand/10 via-accent/5 to-transparent"
      />
      <div className="relative w-full max-w-sm">
        <GroceriesIllustration className="mx-auto mb-4 h-24 w-48" />
        <div className="mb-8 text-center">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <ChefHat className="h-5 w-5" />
            </span>
            PantryPilot
          </h1>
          <p className="mt-1 text-sm text-muted">
            Meal planning, pantry tracking and shopping lists for your household.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          {mode === "signin" ? (
            <form action={signIn} className="space-y-4">
              <Field label="Email" name="email" type="email" required />
              <Field label="Password" name="password" type="password" required />
              <button
                type="submit"
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-dark"
              >
                Sign in
              </button>
            </form>
          ) : (
            <form action={signUp} className="space-y-4">
              <Field label="Your name" name="displayName" type="text" required />
              <Field label="Email" name="email" type="email" required />
              <Field
                label="Password"
                name="password"
                type="password"
                required
                minLength={6}
              />
              <Field
                label="Household invite code (optional)"
                name="inviteCode"
                type="text"
                placeholder="Leave blank to start a new household"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-dark"
              >
                Create account
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <Link href="/login?mode=signup" className="font-medium text-brand">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-brand">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
