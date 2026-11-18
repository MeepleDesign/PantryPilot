"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { startImpromptuCook } from "@/lib/actions/planner";
import { useToast } from "@/components/toast";

export function CookNowButton({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const showToast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const entryId = await startImpromptuCook(recipeId);
            router.push(`/planner/cook/${entryId}`);
          } catch {
            showToast("Couldn't start cooking — try again.");
          }
        })
      }
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? <Spinner className="h-4 w-4" /> : <ChefHat className="h-4 w-4" />}
      {pending ? "Starting…" : "Cook now"}
    </button>
  );
}
