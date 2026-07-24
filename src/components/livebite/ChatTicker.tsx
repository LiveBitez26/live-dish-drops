import { CHAT_ACTIVITY } from "@/lib/livebite-data";

export function ChatTicker() {
  const doubled = [...CHAT_ACTIVITY, ...CHAT_ACTIVITY];
  return (
    <div className="ticker-fade w-full overflow-hidden bg-gradient-to-t from-black/90 to-transparent px-3 py-3">
      <div className="marquee-track flex w-max gap-3 whitespace-nowrap">
        {doubled.map((line, i) => (
          <span
            key={i}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur"
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
