export type CartItem = {
  productSlug: string;
  quantity: number;
};

const CART_KEY = "fvp_customer_cart";
export const CART_UPDATED_EVENT = "fvp-cart-updated";

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
  try {
    return safeParse(window.localStorage.getItem(CART_KEY));
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addToCart(productSlug: string, quantity = 1) {
  const normalizedProductSlug = productSlug.trim();
  if (!normalizedProductSlug) {
    throw new Error("Product could not be added to cart.");
  }

  const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  const current = getCartItems();
  const existing = current.find((item) => item.productSlug === normalizedProductSlug);
  if (existing) {
    existing.quantity += normalizedQuantity;
  } else {
    current.push({ productSlug: normalizedProductSlug, quantity: normalizedQuantity });
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
  window.localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
