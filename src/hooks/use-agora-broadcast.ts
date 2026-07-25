import { useEffect, useRef, useState } from "react";
import { getAgoraToken } from "@/lib/server/agora";

type BroadcastState = "idle" | "connecting" | "live" | "error";

/**
 * Studio-side hook. Call `start(channelName)` from the "Go Live" button and
 * `stop()` from "End stream". `videoRef` should be attached to a <div> in
 * the camera preview area — Agora renders the local video track into it.
 */
export function useAgoraBroadcast() {
  const clientRef = useRef<any>(null);
  const tracksRef = useRef<{ audio: any; video: any } | null>(null);
  const [state, setState] = useState<BroadcastState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  async function start(channelName: string, previewEl: HTMLElement) {
    setState("connecting");
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const { appId, token, uid } = await getAgoraToken({
        data: { channelName, role: "host" },
      });

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("host");
      await client.join(appId, channelName, token, uid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      videoTrack.play(previewEl);
      await client.publish([audioTrack, videoTrack]);

      clientRef.current = client;
      tracksRef.current = { audio: audioTrack, video: videoTrack };
      setState("live");
    } catch (err) {
      console.error("Agora broadcast failed to start:", err);
      setState("error");
    }
  }

  async function stop() {
    tracksRef.current?.audio?.close();
    tracksRef.current?.video?.close();
    await clientRef.current?.unpublish();
    await clientRef.current?.leave();
    clientRef.current = null;
    tracksRef.current = null;
    setState("idle");
  }

  function toggleMic() {
    const next = !micOn;
    tracksRef.current?.audio?.setEnabled(next);
    setMicOn(next);
  }

  function toggleCam() {
    const next = !camOn;
    tracksRef.current?.video?.setEnabled(next);
    setCamOn(next);
  }

  useEffect(() => {
    return () => {
      // best-effort cleanup if the component unmounts mid-stream
      tracksRef.current?.audio?.close();
      tracksRef.current?.video?.close();
      clientRef.current?.leave();
    };
  }, []);

  return { state, micOn, camOn, start, stop, toggleMic, toggleCam };
}
