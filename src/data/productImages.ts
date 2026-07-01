import type { Product } from "../types/domain";

type ProductImageInput = Pick<Product, "slug" | "name" | "category" | "imageUrl">;

const DEFAULT_PRODUCT_IMAGE = "/assets/product-seeds.jpg";
const FRESH_PRODUCE_IMAGE = "/assets/hero-card.jpg";

export const localProductImages: Record<string, string> = {
  "fresh-potato": FRESH_PRODUCE_IMAGE,
  "fresh-potatoes": FRESH_PRODUCE_IMAGE,
  "golden-wheat-seed-pack": "/assets/product-seeds.jpg",
  "biorich-organic-fertilizer": "/assets/product-fertilizer.jpg",
  "fieldpro-sprayer-kit": "/assets/product-equipment.jpg"
};

function resolveApiOrigin(baseUrl: string) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
}

export function getProductFallbackImage(product: ProductImageInput) {
  const searchText = `${product.slug} ${product.name} ${product.category}`.toLowerCase();

  if (localProductImages[product.slug]) {
    return localProductImages[product.slug];
  }
  if (searchText.includes("potato") || searchText.includes("vegetable") || searchText.includes("food")) {
    return FRESH_PRODUCE_IMAGE;
  }
  if (searchText.includes("fertil") || searchText.includes("nutrition") || searchText.includes("feed")) {
    return "/assets/product-fertilizer.jpg";
  }
  if (searchText.includes("equipment") || searchText.includes("tool") || searchText.includes("spray")) {
    return "/assets/product-equipment.jpg";
  }

  return DEFAULT_PRODUCT_IMAGE;
}

export function resolveProductImage(product: ProductImageInput, apiBaseUrl: string) {
  const imageUrl = product.imageUrl?.trim();

  if (!imageUrl) {
    return getProductFallbackImage(product);
  }
  if (imageUrl.startsWith("/assets/")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `${resolveApiOrigin(apiBaseUrl)}${imageUrl}`;
  }

  return imageUrl;
}

export function setProductImageFallback(image: HTMLImageElement, product: ProductImageInput) {
  const fallbackImage = getProductFallbackImage(product);

  if (image.src.endsWith(fallbackImage)) {
    return;
  }

  image.src = fallbackImage;
}
