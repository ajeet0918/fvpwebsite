import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL, fetchProductsApi, readErrorMessage } from "../lib/api";
import { addToCart } from "../lib/cart";
import type { Product } from "../types/domain";
import { resolveProductImage, setProductImageFallback } from "../data/productImages";

const WHATSAPP_QUOTE_URL = "https://wa.me/919650035272?text=I%20want%20a%20bulk%20quote%20from%20FVP%20Purepick.";

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

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

  function setCategoryFilter(nextCategory: string) {
    if (!nextCategory) {
      setSearchParams({});
      return;
    }
    setSearchParams({ category: nextCategory });
  }

  function handleAddToCart(slug: string) {
    addToCart(slug, 1);
    setCartMessage("Product added to cart.");
    window.setTimeout(() => setCartMessage(null), 1800);
  }

  return (
    <section className="section page-top section-soft">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Shop</span>
          <h2>Wholesale Product Catalog</h2>
          <p>Browse active wholesale items, check MOQ, and request a current bulk quote before dispatch.</p>
        </div>

        <div className="shop-filters">
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

        {error ? (
          <div className="banner-error catalog-error">
            <span>{error}</span>
            <a href={WHATSAPP_QUOTE_URL} target="_blank" rel="noreferrer">Request quote on WhatsApp</a>
          </div>
        ) : null}
        {cartMessage ? <p className="form-message">{cartMessage}</p> : null}
        {loading ? <p>Loading catalog...</p> : null}

        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <article key={product.id} className="product-card">
              <div className="product-media">
                <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                <img
                  src={resolveProductImage(product, API_BASE_URL)}
                  alt={product.name}
                  onError={(event) => setProductImageFallback(event.currentTarget, product)}
                />
                <span className="product-status-badge">{product.status === "ACTIVE" ? "Available" : "Check availability"}</span>
              </div>
              <div className="product-body">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                <div className="product-card-meta">
                  <span>MOQ: {product.moq || "Ask on quote"}</span>
                  <span>{product.price ? "Rate listed" : "Price on request"}</span>
                </div>
                <div className="shop-card-actions">
                  <Link className="button button-secondary button-small" to={`/shop/${product.slug}`}>View Catalog</Link>
                  <a className="button button-secondary button-small" href={`${WHATSAPP_QUOTE_URL}%20Product:%20${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">
                    Get Bulk Quote
                  </a>
                  <button type="button" className="button button-primary button-small" onClick={() => handleAddToCart(product.slug)}>
                    Add To Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && !error && filteredProducts.length === 0 ? <p>No products found for this category.</p> : null}
        {!error ? (
          <div className="home-shop-cta">
            <Link className="button button-primary" to="/checkout">Go To Checkout</Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
