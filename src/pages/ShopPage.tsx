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

  const activeCategory = searchParams.get("category")?.trim().toLowerCase() ?? "";
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!activeCategory) {
      return products;
    }
    return products.filter((item) => item.category.trim().toLowerCase() === activeCategory);
  }, [activeCategory, products]);

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
    <section className="section page-top section-soft">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Shop</span>
          <h2>Product Catalog</h2>
          <p>Browse products, compare the essentials, and add what you need to a single order request.</p>
        </div>

        <div className="shop-toolbar">
          <div className="shop-filter-copy">
            <strong>{loading ? "Loading catalog" : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} available`}</strong>
            <span>{activeCategory ? `Showing ${searchParams.get("category")}` : "Choose a category to narrow the catalog."}</span>
          </div>
          {activeCategory ? <button type="button" className="shop-clear-filter" onClick={() => setCategoryFilter("")}>Clear filter</button> : null}
        </div>

        <div className="shop-filters" aria-label="Filter products by category">
          <button
            type="button"
            className={activeCategory ? "shop-chip" : "shop-chip shop-chip-active"}
            onClick={() => setCategoryFilter("")}
          >
            All
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

        {error ? <div className="banner-error">{error}</div> : null}
        <p className="sr-only" aria-live="polite">{cartMessage ?? ""}</p>
        {cartMessage ? <p className="form-message shop-status-message">{cartMessage}</p> : null}
        {loading ? <div className="catalog-loading" role="status"><span className="catalog-loading-mark" aria-hidden="true" /> Loading catalog...</div> : null}

        <div className="product-grid">
          {filteredProducts.map((product, index) => {
            const cartQuantity = getProductQuantity(product.slug);
            const formattedPrice = formatProductPrice(product.price, product.priceUnit);
            return (
              <article key={product.id} className="product-card">
                <div className="product-media">
                  <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                  <img
                    src={resolveProductImage(product)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = resolveFallbackImage(product);
                    }}
                  />
                </div>
                <div className="product-body">
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.shortDescription}</p>
                  <div className="product-card-price" aria-label={`Price ${formattedPrice}`}>
                    <span className="product-card-price-label">Price</span>
                    <strong className="product-card-price-value">{formattedPrice}</strong>
                  </div>
                  <div className="shop-card-actions">
                    <Link className="button button-secondary button-small" to={`/shop/${product.slug}`}>View Details</Link>
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
                        Add To Cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <strong>No products match this category yet.</strong>
            <p>Try another category or view the complete catalog.</p>
            <button type="button" className="button button-secondary" onClick={() => setCategoryFilter("")}>View all products</button>
          </div>
        ) : null}
        <div className="shop-checkout-bar">
          <div>
            <strong>{cartItems.reduce((total, item) => total + item.quantity, 0)} item{cartItems.reduce((total, item) => total + item.quantity, 0) === 1 ? "" : "s"} in your cart</strong>
            <span>Review quantities before proceeding to checkout.</span>
          </div>
          <Link className="button button-primary" to="/checkout">Review Cart</Link>
        </div>
      </div>
    </section>
  );
}
