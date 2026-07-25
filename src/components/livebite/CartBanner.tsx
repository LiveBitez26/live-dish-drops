import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart, cartTotal, cartCount } from "@/lib/cart-store";
import { CheckoutDrawer } from "./CheckoutDrawer";

export function CartBanner() {
  const cart = useCart();
  const count = cartCount(cart);
  const [open, setOpen] = useState(false);

  if (count === 0) return null;
  const total = cartTotal(cart);

  return (
    <>
      <div className="fixed inset-x-0 bottom-16 z-50 mx-auto max-w-2xl px-3 md:bottom-4">
        <button
          onClick={() => setOpen(true)}
          className="glow-primary flex w-full items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="text-sm font-bold">
              {count} item{count > 1 ? "s" : ""} · ${total.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl bg-black/25 px-3 py-1.5 text-sm font-bold">
            Checkout Now →
          </div>
        </button>
      </div>
      <CheckoutDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
