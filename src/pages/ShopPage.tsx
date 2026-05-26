import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL, fetchProductsApi, readErrorMessage } from "../lib/api";
import { addToCart } from "../lib/cart";
import type { Product } from "../types/domain";
import { localProductImages } from "../data/productImages";

function resolveApiOrigin(baseUrl: string) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
}

function resolveProductImage(product: Product) {
  if (product.imageUrl) {
    return product.imageUrl.startsWith("/") ? `${resolveApiOrigin(API_BASE_URL)}${product.imageUrl}` : product.imageUrl;
  }
  return localProductImages[product.slug] ?? "/assets/product-seeds.jpg";
}

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
          <h2>Product Catalog</h2>
          <p>Browse real catalog products, review details, and proceed to order flow.</p>
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

        {error ? <div className="banner-error">{error}</div> : null}
        {cartMessage ? <p className="form-message">{cartMessage}</p> : null}
        {loading ? <p>Loading catalog...</p> : null}

        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <article key={product.id} className="product-card">
              <div className="product-media">
                <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                <img src={resolveProductImage(product)} alt={product.name} />
                <div className={`product-icon ${index % 3 === 0 ? "product-icon-green" : index % 3 === 1 ? "product-icon-emerald" : "product-icon-teal"}`}>
                  {product.name.charAt(0)}
                </div>
              </div>
              <div className="product-body">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                <div className="shop-card-actions">
                  <Link className="button button-secondary button-small" to={`/shop/${product.slug}`}>View Details</Link>
                  <button type="button" className="button button-primary button-small" onClick={() => handleAddToCart(product.slug)}>
                    Add To Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && filteredProducts.length === 0 ? <p>No products found for this category.</p> : null}
        <div className="home-shop-cta">
          <Link className="button button-primary" to="/checkout">Go To Checkout</Link>
        </div>
      </div>
    </section>
  );
}
