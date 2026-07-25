# LiveBite Backend Integration Guide

Your frontend is **TanStack Start** (React 19 + TanStack Router, Vite, Nitro server) — not Next.js.
Good news: TanStack Start has its own server runtime, so everything below runs *inside* this repo.
No separate Next.js app or Express server needed.

## 0. What's in this drop

```
supabase/migrations/0001_init_schema.sql   # tables, triggers, RPC
supabase/migrations/0002_rls_policies.sql  # row level security
src/lib/supabase/client.ts                 # browser Supabase client
src/lib/supabase/server.ts                 # server Supabase client (RLS) + admin client (bypasses RLS)
src/lib/supabase/types.ts                  # hand-written DB types (regenerate later)
src/lib/server/auth.ts                     # signUp / signIn / signOut / getCurrentUser server fns
src/lib/server/orders.ts                   # createOrder, updateOrderStatus (accept/decline)
src/lib/server/stripe-connect.ts           # creator Connect onboarding
src/lib/server/stripe-checkout.ts          # checkout session w/ split payment
src/lib/server/doordash.ts                 # Drive dispatch (placeholder — needs your API creds)
src/lib/server/agora.ts                    # mints signed Agora RTC tokens (host/audience)
src/routes/api/stripe/webhook.ts           # raw HTTP webhook endpoint
src/hooks/use-auth.ts
src/hooks/use-realtime-orders.ts           # powers Studio's "Incoming orders"
src/hooks/use-menu-items.ts                # powers live inventory / sold-out state
src/hooks/use-daily-feed.ts                # posts + comments
src/hooks/use-agora-broadcast.ts           # creator-side: publish camera/mic to Agora
src/hooks/use-agora-viewer.ts              # viewer-side: subscribe to the host's stream
src/components/LiveVideoPlayer.tsx         # drop-in viewer player using the hook above
src/routes/studio.tsx                      # REWIRED — real orders/inventory/menu AND real Agora broadcast
src/routes/live.$id.tsx                    # REWIRED — real creator/menu/inventory + real Agora playback
src/lib/server/creators.ts                 # fetches a creator's profile + menu + active live stream
.env.local.example
```

## 1. Copy files into your repo

Unzip the bundle at the root of `live-dish-drops` (same level as `src/`) so paths line up, then:

```bash
git checkout -b backend/supabase-stripe-doordash
git add .
git commit -m "Wire up Supabase, Stripe Connect, and DoorDash backend"
git push origin backend/supabase-stripe-doordash
```

Open a PR from that branch into `main` — don't push straight to `main`/the Lovable-synced branch, since Lovable syncs off it and you want a clean review point.

## 2. Install the new dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr stripe jsonwebtoken zod agora-rtc-sdk-ng agora-token
npm install -D @types/jsonwebtoken
```

(`zod` is likely already present via `react-hook-form`'s resolvers — fine either way.)

## 3. Set up Supabase

1. Create a project at supabase.com.
2. In the SQL Editor, run `supabase/migrations/0001_init_schema.sql`, then `0002_rls_policies.sql` (in that order).
3. Auth → Providers: enable Email, and any social providers you want (Google, Apple, etc.) — the `signInWithOAuth` server function already supports `google | apple | facebook`.
4. Copy your Project URL, anon key, and service role key into `.env.local` (copy `.env.local.example` → `.env.local` first).
5. Realtime is enabled on `orders`, `menu_items`, `live_streams`, `posts`, `post_comments` by the migration itself (the `alter publication supabase_realtime add table ...` lines).

## 4. Set up Stripe Connect

1. Dashboard → Connect → get your platform enabled for Express accounts.
2. Add `STRIPE_SECRET_KEY` to `.env.local`.
3. Add a webhook endpoint pointing at `https://your-domain.com/api/stripe/webhook`, subscribed to at least `checkout.session.completed` and `checkout.session.expired`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Creator onboarding flow: call `startCreatorStripeOnboarding` from a "Connect payouts" button on the creator's settings page (not yet built in the UI — this is the server-side half; wire a button that calls it and `window.location.href = url`).
5. **Money flow**: checkout creates a destination charge — the customer pays, Stripe splits `application_fee_amount` (15%, defined in `orders.ts`) to LiveBite and transfers the rest straight to the creator's connected account. No manual payout code needed.

## 5. Live video (Agora)

`studio.tsx` is now wired to a **real** Agora broadcast — pressing "Go Live" creates a `live_streams` row, uses its `id` as the Agora channel name, requests a signed token server-side, and publishes the creator's camera/mic into the preview box. Ending the stream unpublishes and closes the tracks.

1. Sign up at agora.io (10,000 free minutes/month, ongoing).
2. Console → your project → copy the **App ID**, and enable/copy the **App Certificate** (this turns on token security — required for production; without it anyone with your App ID could join any channel).
3. Add both to `.env.local`.
4. Install the client packages:
   ```bash
   npm install agora-rtc-sdk-ng agora-token
   ```
5. Viewer side isn't wired into `live.$id.tsx` yet since that page still reads the static `CREATORS` array — see §7 below. The drop-in player component is ready at `src/components/LiveVideoPlayer.tsx`; once that page fetches the creator's real, active `live_streams` row from Supabase, render `<LiveVideoPlayer channelName={activeStream.id} />` and it just works.
6. Token TTL is 1 hour (`TOKEN_TTL_SECONDS` in `agora.ts`) — for streams that might run longer, add a client-side timer that re-fetches a token via `getAgoraToken` and calls `client.renewToken()` before expiry.

## 6. DoorDash Drive

`src/lib/server/doordash.ts` is a real, functioning **skeleton** — correct JWT auth shape, correct endpoint — but it has placeholder fields (`pickup_phone_number`, `dropoff_phone_number`) that need real data:
- Add a `pickup_phone` column to `creators` (or reuse `profiles`), collected during creator onboarding.
- Collect a delivery phone number at checkout and store it in `orders.delivery_address`.
- Get Drive API credentials from developer.doordash.com and add them to `.env.local`.

Until those are filled in, dispatch is skipped with a console warning rather than failing loudly — orders still work end-to-end, they just won't auto-dispatch a driver.

## 7. Auth pages

`src/lib/server/auth.ts` and `src/hooks/use-auth.ts` are ready — you still need actual sign-up/login **route/UI** files (e.g. `src/routes/login.tsx`, `src/routes/signup.tsx`) since none currently exist in the repo. They just call `useAuth().signIn(...)` / `.signUp(...)`.

## 8. What still uses mock data (by design — needs UI decisions from you)

- `src/lib/livebite-data.ts` (`CREATORS`, `DAILY_FEED`) — `studio.tsx` and `live.$id.tsx` are fully off it now. `index.tsx` (home/discovery feed) and `order.$id.tsx` (checkout → tracking) still read the static array and should follow the same pattern — copy how `live.$id.tsx` calls `getCreatorPageData` and swaps `cartStore.add(...)` onto real menu item ids.
- Cart → checkout: `cart-store.ts` holds items in memory correctly now (real `menu_item.id`s), but nothing calls `createCheckoutSession` yet — that's the `order.$id.tsx` rewrite.
- **You need at least one real creator row to test anything.** Sign up through Supabase Auth (or insert directly in the SQL editor), then manually insert a row into `creators` linked to that `profile_id`, plus a couple of `menu_items` rows. `/live/$id` and `/studio` both need a real `creators.id` — there's no seed script in this bundle, since your actual test data (chef handles, dish names, prices) should be real, not the placeholder Marco/Devon/Luca data.

## 9. Order status lifecycle

```
pending → (stripe payment completes) → accepted → preparing → out_for_delivery → delivered
                                     ↘ declined
```
`pending→accepted` also happens automatically via the webhook once Stripe confirms payment — the creator's "Accept" button in Studio is for confirming they'll cook it, which is what triggers DoorDash dispatch.
