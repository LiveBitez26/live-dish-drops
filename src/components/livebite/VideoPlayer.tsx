import { Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  cover: string;
  handle?: string;
  viewers?: number;
  topRight?: React.ReactNode;
  bottom?: React.ReactNode;
  className?: string;
  aspect?: "video" | "portrait";
};

export function VideoPlayer({
  cover,
  handle,
  viewers,
  topRight,
  bottom,
  className,
  aspect = "video",
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-black",
        aspect === "video" ? "aspect-video" : "aspect-[9/12]",
        className
      )}
    >
      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      {/* Top left: LIVE + handle + viewers */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="live-dot">
          <Radio className="h-3 w-3" /> Live
        </span>
        {handle && (
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {handle}
          </span>
        )}
        {typeof viewers === "number" && (
          <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Users className="h-3 w-3" /> {viewers.toLocaleString()}
          </span>
        )}
      </div>

      {topRight && <div className="absolute right-3 top-3">{topRight}</div>}
      {bottom && <div className="absolute inset-x-0 bottom-0">{bottom}</div>}

      {/* Faux play scanline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-destructive to-primary opacity-70" />
    </div>
  );
}
