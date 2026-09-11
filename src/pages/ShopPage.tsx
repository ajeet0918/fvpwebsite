import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CartQuantityControl } from "../components/CartQuantityControl";
import { fetchProductsApi, readErrorMessage } from "../lib/api";
import {
  addToCart,
  CART_UPDATED_EVENT,
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  type CartItem
} from "../lib/cart";
import { resolveDocumentImageUrl } from "../lib/documents";
import { formatProductPrice } from "../lib/formatters";
import type { Product } from "../types/domain";
import { localProductImages } from "../data/productImages";

function resolveProductImage(product: Product) {
  return resolveDocumentImageUrl({
    documentId: product.imageDocumentId,
    legacyUrl: product.imageUrl,
    fallbackUrl: localProductImages[product.slug] ?? "/assets/product-seeds.jpg"
  });
}

function resolveFallbackImage(product: Product) {
  return localProductImages[product.slug] ?? "/assets/product-seeds.jpg";
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getCartItems());
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = searchParams.get("category")?.trim().toLowerCase() ?? "";
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const matchesCategory = !activeCategory || item.category.trim().toLowerCase() === activeCategory;
      const matchesQuery = !normalizedQuery || [item.name, item.category, item.sku, item.shortDescription]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, searchQuery]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchProductsApi();
        setProducts(response);
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load product catalog."));
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(getCartItems());
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  function setCategoryFilter(nextCategory: string) {
    if (!nextCategory) {
      setSearchParams({});
      return;
    }
    setSearchParams({ category: nextCategory });
  }

  function handleAddToCart(slug: string) {
    try {
      setCartItems(addToCart(slug, 1));
      setCartMessage("Product added to cart.");
      window.setTimeout(() => setCartMessage(null), 1800);
    } catch (errorValue) {
      setCartMessage(readErrorMessage(errorValue, "Unable to add this product to cart."));
    }
  }

  function changeCartQuantity(slug: string, nextQuantity: number) {
    const nextCart = nextQuantity <= 0
      ? removeFromCart(slug)
      : updateCartQuantity(slug, nextQuantity);
    setCartItems(nextCart);
  }

  function getProductQuantity(slug: string) {
    return cartItems.find((item) => item.productSlug === slug)?.quantity ?? 0;
  }

  return (
    <section className="section page-top section-soft shop-page">
      <div className="container">
        <div className="shop-hero">
          <div className="section-heading section-heading-left">
            <span className="section-badge">FVP marketplace</span>
            <h2>Everything your farm needs, in one dependable catalog.</h2>
            <p>Compare pack sizes and pricing, build your order, and choose the payment method that works for you at checkout.</p>
          </div>
          <div className="shop-assurance-list" aria-label="Shopping benefits">
            <span><strong>Verified</strong> product listings</span>
            <span><strong>Clear</strong> pack pricing</span>
            <span><strong>Flexible</strong> payment options</span>
          </div>
        </div>

        <div className="shop-toolbar">
          <div className="shop-filter-copy">
            <strong>{loading ? "Loading catalog" : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} found`}</strong>
            <span>{activeCategory ? `Browsing ${searchParams.get("category")}` : "Browse the complete active catalog."}</span>
          </div>
          <label className="shop-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
            </svg>
            <input
              type="search"
              aria-label="Search products"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products or SKU"
            />
            {searchQuery ? (
              <button type="button" aria-label="Clear product search" onClick={() => setSearchQuery("")}>×</button>
            ) : null}
          </label>
        </div>

        <div className="shop-filter-row">
          <div className="shop-filters" aria-label="Filter products by category">
            <button
              type="button"
              className={activeCategory ? "shop-chip" : "shop-chip shop-chip-active"}
              onClick={() => setCategoryFilter("")}
            >
              All products
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category.toLowerCase() ? "shop-chip shop-chip-active" : "shop-chip"}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          {activeCategory ? <button type="button" className="shop-clear-filter" onClick={() => setCategoryFilter("")}>Reset category</button> : null}
        </div>

        {error ? <div className="banner-error">{error}</div> : null}
        <p className="sr-only" aria-live="polite">{cartMessage ?? ""}</p>
        {cartMessage ? <p className="form-message shop-status-message" role="status">{cartMessage}</p> : null}
        {loading ? (
          <div className="catalog-skeleton-grid" role="status" aria-label="Loading product catalog">
            {[0, 1, 2].map((item) => <span className="catalog-skeleton-card" key={item} />)}
          </div>
        ) : null}

        <div className="product-grid shop-product-grid" id="catalog-products">
          {filteredProducts.map((product, index) => {
            const cartQuantity = getProductQuantity(product.slug);
            const formattedPrice = formatProductPrice(product.price, product.priceUnit);
            return (
              <article key={product.id} className="product-card">
                <div className="product-media">
                  <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                  {product.featured ? <span className="product-featured-badge">Popular choice</span> : null}
                  <img
                    src={resolveProductImage(product)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = resolveFallbackImage(product);
                    }}
                  />
                </div>
                <div className="product-body">
                  <div className="product-card-meta">
                    <span className="product-category">{product.category}</span>
                    <span className="product-availability"><i aria-hidden="true" /> Available</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.shortDescription}</p>
                  <div className="product-card-facts" aria-label="Product ordering details">
                    <span><small>Minimum order</small><strong>{product.moq || "Contact us"}</strong></span>
                    <span><small>SKU</small><strong>{product.sku}</strong></span>
                  </div>
                  <div className="product-card-commerce">
                    <div className="product-card-price" aria-label={`Price ${formattedPrice}`}>
                      <span className="product-card-price-label">Your price</span>
                      <strong className="product-card-price-value">{formattedPrice}</strong>
                    </div>
                    <div className="shop-card-actions">
                      <Link className="button button-secondary button-small" to={`/shop/${product.slug}`}>View details</Link>
                      {cartQuantity > 0 ? (
                        <CartQuantityControl
                          compact
                          productName={product.name}
                          quantity={cartQuantity}
                          onDecrease={() => changeCartQuantity(product.slug, cartQuantity - 1)}
                          onIncrease={() => changeCartQuantity(product.slug, cartQuantity + 1)}
                        />
                      ) : (
                        <button type="button" className="button button-primary button-small" onClick={() => handleAddToCart(product.slug)}>
                          Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <strong>No products match your filters.</strong>
            <p>Try a broader search or reset the category to see the full catalog.</p>
            <button type="button" className="button button-secondary" onClick={() => { setSearchQuery(""); setCategoryFilter(""); }}>Reset filters</button>
          </div>
        ) : null}
        {cartItemCount > 0 ? (
          <div className="shop-checkout-bar" aria-label="Cart summary">
            <div>
              <strong>{cartItemCount} item{cartItemCount === 1 ? "" : "s"} ready for checkout</strong>
              <span>Your cart is saved on this device.</span>
            </div>
            <Link className="button button-primary" to="/checkout">Review cart <span aria-hidden="true">→</span></Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
