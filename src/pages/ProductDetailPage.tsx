import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductBySlugApi, readErrorMessage } from "../lib/api";
import { addToCart } from "../lib/cart";
import { resolveDocumentImageUrl } from "../lib/documents";
import type { Product } from "../types/domain";
import { localProductImages } from "../data/productImages";

const DEFAULT_PRODUCT_IMAGE = "/assets/product-seeds.jpg";
const WHATSAPP_NUMBER = "919650035272";

function resolveProductImage(product: Product) {
  return resolveDocumentImageUrl({
    documentId: product.imageDocumentId,
    legacyUrl: product.imageUrl,
    fallbackUrl: localProductImages[product.slug] ?? DEFAULT_PRODUCT_IMAGE
  });
}

function resolveFallbackImage(product: Product) {
  return localProductImages[product.slug] ?? DEFAULT_PRODUCT_IMAGE;
}

function formatPrice(value: number | null, unit: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Price on request";
  }

  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
  return `${formattedValue} / ${unit || "unit"}`;
}

function buildWhatsAppUrl(product: Product) {
  const message = `Hello FVP Purepick, I need a bulk quote for ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) {
        setLoading(false);
        setError("Product not found.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchProductBySlugApi(slug);
        setProduct(response);
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load product details."));
      } finally {
        setLoading(false);
      }
    }

    void loadProduct();
  }, [slug]);

  function handleAddToCart() {
    if (!product) {
      return;
    }

    try {
      const updatedCart = addToCart(product.slug, quantity);
      const updatedCount = updatedCart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(updatedCount);
      setCartAdded(true);
      setMessage(`${product.name} added to cart.`);
      window.setTimeout(() => setMessage(null), 2400);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to add this product to cart."));
    }
  }

  function changeQuantity(delta: number) {
    setQuantity((current) => Math.max(1, current + delta));
  }

  function handleQuantityChange(value: string) {
    const parsedValue = Number(value);
    setQuantity(Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : 1);
  }

  return (
    <section className="section page-top">
      <div className="container">
        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/shop">Shop</Link>
          <span aria-hidden="true">/</span>
          <span>{product?.name ?? "Product details"}</span>
        </nav>

        {loading ? <p className="product-detail-state">Loading product details...</p> : null}
        {error ? <div className="banner-error" role="alert">{error}</div> : null}
        {message ? <p className="form-message" role="status">{message}</p> : null}

        {product ? (
          <article className="product-detail-card">
            <div className="product-detail-media">
              <img
                src={resolveProductImage(product)}
                alt={product.name}
                loading="eager"
                decoding="async"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied === "true") {
                    return;
                  }
                  event.currentTarget.dataset.fallbackApplied = "true";
                  event.currentTarget.src = resolveFallbackImage(product);
                }}
              />
            </div>
            <div className="product-detail-content">
              <div className="product-detail-heading">
                <div className="product-detail-label-row">
                  <span className="product-category">{product.category}</span>
                  {product.sku ? <span className="product-detail-sku">SKU {product.sku}</span> : null}
                </div>
                <h1>{product.name}</h1>
                {product.shortDescription ? <p className="product-detail-lead">{product.shortDescription}</p> : null}
              </div>

              {product.longDescription && product.longDescription !== product.shortDescription ? (
                <div className="product-detail-description">
                  <h2>Product overview</h2>
                  <p>{product.longDescription}</p>
                </div>
              ) : null}

              <dl className="product-detail-meta">
                <div>
                  <dt>Price</dt>
                  <dd>{formatPrice(product.price, product.priceUnit)}</dd>
                </div>
                <div>
                  <dt>Selling unit</dt>
                  <dd>{product.priceUnit || "Available on request"}</dd>
                </div>
                <div>
                  <dt>Minimum order</dt>
                  <dd>{product.moq || "Confirm with quote"}</dd>
                </div>
              </dl>

              <div className="product-detail-purchase">
                <div className="product-detail-purchase-heading">
                  <h2>Order quantity</h2>
                  <span>Wholesale quantity is confirmed during order review.</span>
                </div>
                <div className="product-detail-purchase-row">
                  <div className="quantity-control" aria-label="Order quantity">
                    <button type="button" onClick={() => changeQuantity(-1)} aria-label="Decrease quantity">-</button>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quantity}
                      onChange={(event) => handleQuantityChange(event.target.value)}
                      aria-label="Quantity"
                    />
                    <button type="button" onClick={() => changeQuantity(1)} aria-label="Increase quantity">+</button>
                  </div>
                  <span className="product-detail-unit-hint">{product.priceUnit || "units"}</span>
                </div>
                <div className="product-detail-actions">
                  <button type="button" className="button button-primary" onClick={handleAddToCart} aria-live="polite">
                    {cartAdded ? "Added to Cart" : "Add To Cart"}
                  </button>
                  <Link className="button button-secondary" to={`/order-request?product=${encodeURIComponent(product.slug)}`}>
                    Request Bulk Quote
                  </Link>
                  {cartCount > 0 ? (
                    <Link className="product-detail-checkout-link" to="/checkout">
                      View Cart ({cartCount})
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="product-detail-support">
                <div>
                  <strong>Need a confirmed quote?</strong>
                  <span>Share your quantity and delivery requirement with our team.</span>
                </div>
                <a href={buildWhatsAppUrl(product)} target="_blank" rel="noreferrer" className="product-detail-whatsapp-link">
                  WhatsApp for bulk inquiry
                </a>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
