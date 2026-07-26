import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAgoraToken } from "@/lib/api/agora";

type BroadcastState = "idle" | "connecting" | "live" | "error";

/**
 * Studio-side hook. Call `start(channelName)` from the "Go Live" button and
 * `stop()` from "End stream". `videoRef` should be attached to a <div> in
 * the camera preview area — Agora renders the local video track into it.
 */
export function useAgoraBroadcast() {
  const clientRef = useRef<any>(null);
  const tracksRef = useRef<{ audio: any; video: any } | null>(null);
  const cameraListRef = useRef<any[]>([]);
  const cameraIndexRef = useRef(0);
  const [state, setState] = useState<BroadcastState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

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
      toast("Connected to broadcast server…");

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      toast("Camera & mic captured…");
      videoTrack.play(previewEl);

      await client.publish([audioTrack, videoTrack]);
      toast.success("Publishing video to viewers now");

      clientRef.current = client;
      tracksRef.current = { audio: audioTrack, video: videoTrack };
      setState("live");

      // Detect how many cameras are available (for the flip-camera button on mobile).
      try {
        const cameras = await AgoraRTC.getCameras();
        cameraListRef.current = cameras;
        setHasMultipleCameras(cameras.length > 1);
      } catch {
        // non-fatal — flip button just won't show
      }
    } catch (err) {
      console.error("Agora broadcast failed to start:", err);
      toast.error("Broadcast failed to start", {
        description: (err as Error).message || String(err),
        duration: 15000,
      });
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

  /** Lists available camera/mic devices — call after start(), needs mic/camera permission already granted. */
  async function listDevices() {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    const [cameras, microphones] = await Promise.all([AgoraRTC.getCameras(), AgoraRTC.getMicrophones()]);
    return { cameras, microphones };
  }

  async function switchCamera(deviceId: string) {
    try {
      await tracksRef.current?.video?.setDevice(deviceId);
      const idx = cameraListRef.current.findIndex((c) => c.deviceId === deviceId);
      if (idx >= 0) cameraIndexRef.current = idx;
    } catch (err) {
      toast.error("Couldn't switch camera", { description: (err as Error).message });
    }
  }

  /** One-tap flip between cameras (front/back on a phone). No-op if only one camera exists. */
  async function flipCamera() {
    const cameras = cameraListRef.current;
    if (cameras.length < 2) return;
    const nextIndex = (cameraIndexRef.current + 1) % cameras.length;
    await switchCamera(cameras[nextIndex].deviceId);
  }

  async function switchMicrophone(deviceId: string) {
    try {
      await tracksRef.current?.audio?.setDevice(deviceId);
    } catch (err) {
      toast.error("Couldn't switch microphone", { description: (err as Error).message });
    }
  }

  useEffect(() => {
    return () => {
      // best-effort cleanup if the component unmounts mid-stream
      tracksRef.current?.audio?.close();
      tracksRef.current?.video?.close();
      clientRef.current?.leave();
    };
  }, []);

  return {
    state,
    micOn,
    camOn,
    hasMultipleCameras,
    start,
    stop,
    toggleMic,
    toggleCam,
    listDevices,
    switchCamera,
    switchMicrophone,
    flipCamera,
  };
}
