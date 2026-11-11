import type { LucideIcon } from "lucide-react";

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
      className={`animate-fade-in-up flex flex-col items-center gap-1.5 text-center ${
        compact ? "py-4" : "py-14"
      } ${className ?? ""}`}
    >
      <span
        className={`flex items-center justify-center rounded-2xl bg-brand/10 text-brand-dark ${
          compact ? "h-10 w-10" : "h-14 w-14"
        }`}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={1.5} />
      </span>
      <p className={compact ? "text-xs font-medium" : "text-sm font-medium"}>{title}</p>
      {body && (
        <p className={`max-w-[20rem] text-muted ${compact ? "text-[11px]" : "text-xs"}`}>
          {body}
        </p>
      )}
      {action}
    </div>
  );
}
