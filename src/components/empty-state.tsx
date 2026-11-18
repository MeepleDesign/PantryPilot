import type { LucideIcon } from "lucide-react";

/**
 * Shared empty state. The icon sits in a small illustrated "halo" — soft
 * concentric rings plus a few accent sparkles — drawn with theme tokens so
 * it follows dark mode and the user's accent colour.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up flex flex-col items-center text-center ${
        compact ? "gap-1.5 py-4" : "gap-2 py-12"
      } ${className ?? ""}`}
    >
      {compact ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand-dark ring-4 ring-brand/5">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      ) : (
        <span className="relative mb-1 flex h-28 w-28 items-center justify-center">
          <svg
            aria-hidden
            viewBox="0 0 112 112"
            className="absolute inset-0 h-full w-full"
            fill="none"
          >
            <circle cx="56" cy="56" r="54" fill="var(--brand)" fillOpacity="0.04" />
            <circle
              cx="56"
              cy="56"
              r="42"
              fill="var(--brand)"
              fillOpacity="0.06"
              stroke="var(--brand)"
              strokeOpacity="0.15"
              strokeDasharray="3 5"
            />
            {/* sparkles */}
            <path
              d="M93 22v8M89 26h8"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="18" cy="78" r="3" fill="var(--accent)" fillOpacity="0.55" />
            <circle cx="24" cy="26" r="2" fill="var(--brand)" fillOpacity="0.4" />
            <circle cx="92" cy="86" r="2.5" fill="var(--brand)" fillOpacity="0.35" />
          </svg>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/15 bg-surface text-brand-dark shadow-sm">
            <Icon className="h-7 w-7" strokeWidth={1.5} />
          </span>
        </span>
      )}
      <p className={compact ? "text-xs font-medium" : "text-base font-semibold tracking-tight"}>
        {title}
      </p>
      {body && (
        <p className={`max-w-[22rem] text-muted ${compact ? "text-[11px]" : "text-sm"}`}>
          {body}
        </p>
      )}
      {action && <div className={compact ? "mt-1" : "mt-2"}>{action}</div>}
    </div>
  );
}
