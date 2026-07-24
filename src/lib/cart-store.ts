import { useSyncExternalStore } from "react";
import type { MenuItem } from "./livebite-data";

export type CartLine = { item: MenuItem; qty: number; creatorId: string; creatorHandle: string };

let cart: CartLine[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const cartStore = {
  add(item: MenuItem, creatorId: string, creatorHandle: string) {
    const existing = cart.find((l) => l.item.id === item.id);
    if (existing) existing.qty += 1;
    else cart = [...cart, { item, qty: 1, creatorId, creatorHandle }];
    emit();
  },
  remove(id: string) {
    cart = cart.filter((l) => l.item.id !== id);
    emit();
  },
  clear() {
    cart = [];
    emit();
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  snapshot() {
    return cart;
  },
};

export function useCart() {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.snapshot,
    () => [] as CartLine[]
  );
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.qty * l.item.price, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.qty, 0);
}
