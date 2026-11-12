import { ImageIcon } from "lucide-react";

export function StockPhotoBadge({
  withLabel = false,
  className = "",
}: {
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      title="Stock photo — not an actual photo of this dish"
      aria-label="Stock photo"
      className={`absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm ${className}`}
    >
      <ImageIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {withLabel && <span>Stock photo</span>}
    </span>
  );
}
