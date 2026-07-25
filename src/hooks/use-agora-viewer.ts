import { useEffect, useRef, useState } from "react";
import { getAgoraToken } from "@/lib/server/agora";

type ViewerState = "idle" | "connecting" | "watching" | "ended" | "error";

/**
 * Customer-side hook for /live/$id. Attach `videoRef` to a container div;
 * Agora renders the host's remote video track into it once they're live.
 */
export function useAgoraViewer(channelName: string | undefined, videoRef: React.RefObject<HTMLDivElement>) {
  const clientRef = useRef<any>(null);
  const [state, setState] = useState<ViewerState>("idle");

  useEffect(() => {
    if (!channelName || !videoRef.current) return;
    let cancelled = false;

    async function join() {
      setState("connecting");
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const { appId, token, uid } = await getAgoraToken({
          data: { channelName: channelName!, role: "audience" },
        });

        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        await client.setClientRole("audience");

        client.on("user-published", async (user: any, mediaType: "audio" | "video") => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && videoRef.current && !cancelled) {
            user.videoTrack?.play(videoRef.current);
            setState("watching");
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", () => {
          if (!cancelled) setState("ended");
        });

        await client.join(appId, channelName!, token, uid);
        clientRef.current = client;
      } catch (err) {
        console.error("Agora viewer join failed:", err);
        if (!cancelled) setState("error");
      }
    }

    join();

    return () => {
      cancelled = true;
      clientRef.current?.leave();
      clientRef.current = null;
    };
  }, [channelName]);

  return state;
}
