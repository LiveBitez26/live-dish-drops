// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Once your project is linked, regenerate the real thing with:
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts

export type OrderStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "preparing"
  | "out_for_delivery"
  | "delivered";

export type StreamStatus = "scheduled" | "live" | "ended";
export type PostContentType = "photo" | "video" | "upcoming_drop";
export type ProfileRole = "customer" | "creator";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: ProfileRole;
          full_name: string | null;
          avatar_url: string | null;
          notify_new_drops: boolean;
          notify_order_updates: boolean;
          phone_number: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      creators: {
        Row: {
          id: string;
          profile_id: string;
          handle: string;
          bio: string | null;
          follower_count: number;
          rating: number;
          location: string | null;
          is_live: boolean;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          kitchen_type: "licensed_commercial" | "food_truck" | "ghost_kitchen" | "home_kitchen" | null;
          business_name: string | null;
          permit_number: string | null;
          permit_expires_on: string | null;
          verification_status: "pending" | "approved" | "rejected";
          verification_notes: string | null;
          banner_url: string | null;
          delivery_radius_miles: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["creators"]["Row"]> & { profile_id: string; handle: string };
        Update: Partial<Database["public"]["Tables"]["creators"]["Row"]>;
      };
      menu_items: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          price: number;
          total_inventory: number;
          remaining_inventory: number;
          is_available: boolean;
          image_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]> & { creator_id: string; name: string; price: number };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
      };
      live_streams: {
        Row: {
          id: string;
          creator_id: string;
          stream_key: string;
          playback_url: string | null;
          title: string | null;
          status: StreamStatus;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["live_streams"]["Row"]> & { creator_id: string };
        Update: Partial<Database["public"]["Tables"]["live_streams"]["Row"]>;
      };
      posts: {
        Row: {
          id: string;
          creator_id: string;
          content_type: PostContentType;
          media_url: string | null;
          caption: string | null;
          drop_time: string | null;
          price: number | null;
          likes_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["posts"]["Row"]> & { creator_id: string; content_type: PostContentType };
        Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: { post_id: string; author_id: string; body: string };
        Update: Partial<Database["public"]["Tables"]["post_comments"]["Row"]>;
      };
      delivery_addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          zip: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          label: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          zip: string;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["delivery_addresses"]["Row"]>;
      };
      follows: {
        Row: { follower_id: string; creator_id: string; created_at: string };
        Insert: { follower_id: string; creator_id: string };
        Update: Partial<{ follower_id: string; creator_id: string }>;
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          creator_id: string;
          rating: number;
          body: string | null;
          created_at: string;
        };
        Insert: { order_id: string; customer_id: string; creator_id: string; rating: number; body?: string | null };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      scheduled_drops: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          created_at: string;
        };
        Insert: { creator_id: string; title: string; description?: string | null; scheduled_at: string };
        Update: Partial<Database["public"]["Tables"]["scheduled_drops"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          creator_id: string;
          items: { menu_item_id: string; name: string; qty: number; unit_price: number }[];
          total_amount: number;
          platform_fee_amount: number;
          creator_payout_amount: number;
          status: OrderStatus;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          doordash_delivery_id: string | null;
          delivery_address: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          customer_id: string;
          creator_id: string;
          items: Database["public"]["Tables"]["orders"]["Row"]["items"];
          total_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
    };
  };
}
