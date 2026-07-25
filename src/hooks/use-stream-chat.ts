import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface StreamMessage {
  id: string;
  stream_id: string;
  sender_id: string;
  sender_handle: string;
  is_creator: boolean;
  body: string;
  created_at: string;
}

/** Live chat for one stream. Works identically for the creator and viewers. */
export function useStreamChat(streamId: string | undefined) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);

  useEffect(() => {
    if (!streamId) {
      setMessages([]);
      return;
    }
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("stream_messages")
      .select("*")
      .eq("stream_id", streamId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setMessages(data as StreamMessage[]);
      });

    const channel = supabase
      .channel(`chat:stream:${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stream_messages", filter: `stream_id=eq.${streamId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as StreamMessage]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return messages;
}

export async function sendStreamMessage(params: {
  streamId: string;
  senderId: string;
  senderHandle: string;
  isCreator: boolean;
  body: string;
}) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("stream_messages").insert({
    stream_id: params.streamId,
    sender_id: params.senderId,
    sender_handle: params.senderHandle,
    is_creator: params.isCreator,
    body: params.body,
  });
  if (error) throw new Error(error.message);
}
