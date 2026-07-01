import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL, fetchProductBySlugApi, readErrorMessage } from "../lib/api";
import { addToCart } from "../lib/cart";
import type { Product } from "../types/domain";
import { resolveProductImage, setProductImageFallback } from "../data/productImages";

const WHATSAPP_NUMBER = "919650035272";

function formatPrice(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return "Price on request";
  }
  return `INR ${value.toFixed(2)} / ${unit}`;
}

function getWholesaleGrade(product: Product) {
  const searchText = `${product.name} ${product.category}`.toLowerCase();

  if (searchText.includes("potato") || searchText.includes("vegetable") || searchText.includes("food")) {
    return "Wholesale sorting grade";
  }
  if (searchText.includes("seed")) {
    return "Batch quality checked";
  }
  if (searchText.includes("fertil")) {
    return "Supplier quality checked";
  }

  return "Commercial supply grade";
}

function getPackagingSize(product: Product) {
  if (product.moq) {
    return product.moq;
  }
  if (product.priceUnit) {
    return `Per ${product.priceUnit}`;
  }

  return "Confirmed during quote";
}

function getWhatsappProductUrl(product: Product) {
  const text = `I want a bulk quote from FVP Purepick for ${product.name} (${product.sku}). MOQ: ${product.moq || "please confirm"}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

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
    addToCart(product.slug, quantity);
    setMessage("Added to cart.");
    window.setTimeout(() => setMessage(null), 1800);
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Product Details</span>
          <h2>{product?.name ?? "Catalog Product"}</h2>
          <p>Review wholesale details, confirm current availability, and continue to order flow.</p>
        </div>

        {loading ? <p>Loading product details...</p> : null}
        {error ? (
          <div className="banner-error catalog-error">
            <span>{error}</span>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Ask on WhatsApp</a>
          </div>
        ) : null}
        {message ? <p className="form-message">{message}</p> : null}

        {product ? (
          <article className="product-detail-card">
            <div className="product-detail-media">
              <img
                src={resolveProductImage(product, API_BASE_URL)}
                alt={product.name}
                onError={(event) => setProductImageFallback(event.currentTarget, product)}
              />
            </div>
            <div className="product-detail-content">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.longDescription || product.shortDescription}</p>
              <div className="product-detail-meta">
                <div><strong>Price</strong><span>{formatPrice(product.price, product.priceUnit)}</span></div>
                <div><strong>Packaging</strong><span>{getPackagingSize(product)}</span></div>
                <div><strong>MOQ</strong><span>{product.moq || "-"}</span></div>
              </div>
              <div className="wholesale-detail-grid">
                <div><strong>Grade</strong><span>{getWholesaleGrade(product)}</span></div>
                <div><strong>Availability</strong><span>{product.status === "ACTIVE" ? "Available for inquiry" : "Check before order"}</span></div>
                <div><strong>Delivery Area</strong><span>Owner to confirm service zones</span></div>
                <div><strong>Price Update</strong><span>Confirmed before dispatch</span></div>
              </div>
              <div className="shop-card-actions">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value) > 0 ? Number(event.target.value) : 1)}
                  className="product-qty-input"
                />
                <button type="button" className="button button-primary" onClick={handleAddToCart}>
                  Add To Cart
                </button>
                <a className="button button-whatsapp" href={getWhatsappProductUrl(product)} target="_blank" rel="noreferrer">
                  WhatsApp Inquiry
                </a>
                <Link className="button button-primary" to="/checkout">
                  Checkout
                </Link>
                <Link className="button button-secondary" to="/shop">
                  Back To Shop
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
