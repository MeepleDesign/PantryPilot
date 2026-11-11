"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { Spinner } from "@/components/spinner";

function LinkButtonContent({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={`flex items-center gap-1.5 ${pending ? "opacity-60" : ""}`}>
      {pending && <Spinner className="h-4 w-4" />}
      {children}
    </span>
  );
}

/**
 * A Next.js <Link> styled as a button that shows a spinner and dims while the
 * navigation it triggers is in flight, so a click always gets visible feedback
 * even before the destination page has anything to render.
 */
export function LinkButton({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      <LinkButtonContent>{children}</LinkButtonContent>
    </Link>
  );
}
