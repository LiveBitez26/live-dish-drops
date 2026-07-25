import { createServerFn } from "@tanstack/react-start";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour; re-fetch on expiry from the client if a stream runs longer

const tokenSchema = z.object({
  channelName: z.string().min(1), // use the live_streams.id (uuid) as the channel name
  role: z.enum(["host", "audience"]),
});

/**
 * Mints a channel-scoped Agora RTC token.
 * - "host" tokens are only issued to the creator who owns that live_stream row.
 * - "audience" tokens are issued to anyone signed in (swap for anonymous
 *   uid-based tokens if you want unauthenticated viewers to be able to watch).
 */
export const getAgoraToken = createServerFn({ method: "POST" })
  .inputValidator(tokenSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    if (data.role === "host") {
      const { data: stream, error } = await supabase
        .from("live_streams")
        .select("id, creator_id, creators!inner(profile_id)")
        .eq("id", data.channelName)
        .single();
      if (error || !stream) throw new Error("STREAM_NOT_FOUND");
      if ((stream as any).creators.profile_id !== userData.user.id) {
        throw new Error("FORBIDDEN");
      }
    }

    const appId = getEnv("AGORA_APP_ID")!;
    const appCertificate = getEnv("AGORA_APP_CERTIFICATE")!;
    const expireAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

    // Agora uids are numeric; derive a stable one from the user's UUID.
    const uid = hashToUint32(userData.user.id);

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      data.channelName,
      uid,
      data.role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      expireAt,
      expireAt,
    );

    return { appId, token, uid, channelName: data.channelName, expiresAt: expireAt };
  });

function hashToUint32(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}
