export type CartItem = {
  productSlug: string;
  quantity: number;
};

const CART_KEY = "fvp_customer_cart";

function safeParse(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => typeof item?.productSlug === "string")
      .map((item) => ({
        productSlug: item.productSlug,
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1
      }));
  } catch {
    return [];
  }
}

export function getCartItems(): CartItem[] {
  return safeParse(localStorage.getItem(CART_KEY));
}

export function setCartItems(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(productSlug: string, quantity = 1) {
  const current = getCartItems();
  const existing = current.find((item) => item.productSlug === productSlug);
  if (existing) {
    existing.quantity += Math.max(1, Math.floor(quantity));
  } else {
    current.push({ productSlug, quantity: Math.max(1, Math.floor(quantity)) });
  }
  setCartItems(current);
  return current;
}

export function updateCartQuantity(productSlug: string, quantity: number) {
  const normalized = Math.max(1, Math.floor(quantity));
  const next = getCartItems().map((item) => item.productSlug === productSlug ? { ...item, quantity: normalized } : item);
  setCartItems(next);
  return next;
}

export function removeFromCart(productSlug: string) {
  const next = getCartItems().filter((item) => item.productSlug !== productSlug);
  setCartItems(next);
  return next;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
