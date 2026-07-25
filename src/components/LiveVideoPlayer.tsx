import { useRef } from "react";
import { useAgoraViewer } from "@/hooks/use-agora-viewer";

/**
 * Usage once live.$id.tsx is switched to real data (fetch the creator's
 * active live_streams row — its `id` IS the Agora channel name):
 *
 *   <LiveVideoPlayer channelName={activeStream?.id} />
 *
 * Renders a "stream hasn't started" placeholder until the host publishes.
 */
export function LiveVideoPlayer({ channelName }: { channelName: string | undefined }) {
  const videoRef = useRef<HTMLDivElement>(null);
  const state = useAgoraViewer(channelName, videoRef);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div ref={videoRef} className="absolute inset-0 h-full w-full" />
      {state !== "watching" && (
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-muted-foreground">
          {state === "connecting" && "Connecting to stream…"}
          {state === "idle" && "Waiting for the chef to go live…"}
          {state === "ended" && "Stream has ended"}
          {state === "error" && "Couldn't connect — refresh to retry"}
        </div>
      )}
    </div>
  );
}
