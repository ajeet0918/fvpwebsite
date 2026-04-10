import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, fetchProductsApi, readErrorMessage, submitLeadApi } from "../lib/api";
import type { Product } from "../types/domain";
import { localProductImages } from "../data/productImages";

const serviceCards = [
  ["Seeds", "High-quality seeds for cereals, grains, vegetables, fruits, and legumes."],
  ["Fertilizers", "Organic and chemical fertilizers selected for performance and soil compatibility."],
  ["Pesticides and Insecticides", "Crop protection products chosen for safety, compliance, and efficacy."],
  ["Animal Feed", "Nutritious feed options for cattle, poultry, and other livestock."],
  ["Agricultural Tools and Equipment", "Essential hand tools, power tools, and machinery support products."],
  ["Food Products", "Wholesale grains, pulses, spices, and selected processed food items."]
] as const;

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);

  const productCards = useMemo(
    () => (products.filter((product) => product.featured).slice(0, 3).length > 0
      ? products.filter((product) => product.featured).slice(0, 3)
      : products.slice(0, 3)),
    [products]
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProducts(await fetchProductsApi());
      } catch (error) {
        setPageError(readErrorMessage(error, "Unable to load products."));
      } finally {
        setLoadingProducts(false);
      }
    }

    void loadProducts();
  }, []);

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadSubmitting(true);
    setLeadMessage(null);

    try {
      await submitLeadApi({
        fullName: leadName,
        email: leadEmail,
        phone: leadPhone
      });
      setLeadMessage("Thanks. Our team will contact you shortly.");
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
    } catch (error) {
      setLeadMessage(readErrorMessage(error, "Unable to save your details right now."));
    } finally {
      setLeadSubmitting(false);
    }
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay" />
          <img src="/assets/hero-bg.jpg" alt="Agricultural Fields" />
        </div>
        <div className="container hero-content">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Wholesale sourcing for modern agriculture businesses</span>
              <h1>
                Premium Wholesale
                <span>Agricultural Products</span>
              </h1>
              <p className="hero-lead">
                Discover catalog products, submit bulk order requests, and track order status from one public
                customer experience.
              </p>
              <div className="hero-feature-list">
                {["Live product catalog", "Bulk order request", "Public order tracking", "Support-first workflow"].map((item) => (
                  <div key={item} className="hero-feature-item">
                    <span className="hero-check">OK</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="hero-actions">
                <Link className="button button-primary button-large" to="/order-request">Request Bulk Order</Link>
                <Link className="button button-outline button-large" to="/track-order">Track Order</Link>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-panel-glow" />
              <div className="hero-panel-card">
                <img src="/assets/hero-card.jpg" alt="Fresh Produce" />
                <div className="hero-panel-copy">
                  <h3>Public Experience</h3>
                  <div className="hero-panel-list">
                    {["Catalog browsing", "Order request flow", "Tracking by order number", "Marketing and contact pages"].map((item) => (
                      <div key={item} className="hero-panel-item">
                        <span className="hero-panel-bullet">-</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-fade" />
      </section>

      {pageError ? <div className="banner-error">{pageError}</div> : null}

      <section id="products" className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Our Products</span>
            <h2>Wholesale Agricultural Products</h2>
            <p>Explore our featured wholesale products and minimum order quantities.</p>
          </div>

          <div className="product-grid">
            {loadingProducts
              ? Array.from({ length: 3 }, (_, index) => (
                  <article key={index} className="product-card product-card-loading">
                    <div className="product-media skeleton-block" />
                    <div className="product-body">
                      <div className="skeleton-line skeleton-line-lg" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                    </div>
                  </article>
                ))
              : productCards.map((product, index) => (
                  <article key={product.id} className="product-card">
                    <div className="product-media">
                      <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                      <img
                        src={
                          product.imageUrl
                            ? (product.imageUrl.startsWith("/") ? `${API_BASE_URL}${product.imageUrl}` : product.imageUrl)
                            : (localProductImages[product.slug] ?? "/assets/product-seeds.jpg")
                        }
                        alt={product.name}
                      />
                      <div className={`product-icon ${index % 3 === 0 ? "product-icon-green" : index % 3 === 1 ? "product-icon-emerald" : "product-icon-teal"}`}>
                        {product.name.charAt(0)}
                      </div>
                    </div>
                    <div className="product-body">
                      <span className="product-category">{product.category}</span>
                      <h3>{product.name}</h3>
                      <p>{product.shortDescription}</p>
                      <div className="product-meta">
                        <span>MOQ: {product.moq}</span>
                        <span>Slug: {product.slug}</span>
                      </div>
                    </div>
                  </article>
                ))}
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">About Us</span>
            <h2>Why Choose FVP Pure Pick Suppliers OPC Pvt. Ltd.?</h2>
            <p>
              We deliver premium, reliable, and diverse agricultural products at wholesale prices with a
              customer-first approach.
            </p>
          </div>

          <div className="about-layout">
            <article className="about-card">
              <h3>Our Promise</h3>
              <p>
                FVP Purepick supports farmers, distributors, and agri businesses with quality-assured products,
                competitive bulk pricing, and reliable fulfillment.
              </p>
              <p>
                We build long-term partnerships through transparent communication, practical guidance, and
                flexible supply support.
              </p>
            </article>

            <article className="about-card">
              <h3>Why Businesses Trust Us</h3>
              <ul className="about-list">
                <li>Quality assurance and verified sourcing standards</li>
                <li>Competitive wholesale pricing and bulk order flexibility</li>
                <li>Reliable supply chain and timely delivery coordination</li>
                <li>Dedicated support with practical, customer-focused guidance</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Core Products</span>
            <h2>Our Core Products and Services</h2>
            <p>
              Complete wholesale sourcing support for agriculture and food supply operations.
            </p>
          </div>

          <div className="service-grid">
            {serviceCards.map(([title, description], index) => (
              <article key={title} className="service-card">
                <div className="service-icon">{index + 1}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Contact</span>
            <h2>Share Your Details</h2>
            <p>Drop your name, email, and phone number. We will reach out for wholesale assistance.</p>
          </div>
          <form className="lead-form" onSubmit={handleLeadSubmit}>
            <label>
              Full Name
              <input value={leadName} onChange={(event) => setLeadName(event.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} required />
            </label>
            <label>
              Phone
              <input value={leadPhone} onChange={(event) => setLeadPhone(event.target.value)} required />
            </label>
            <button type="submit" className="button button-primary" disabled={leadSubmitting}>
              {leadSubmitting ? "Submitting..." : "Submit"}
            </button>
            {leadMessage ? <p className="form-message">{leadMessage}</p> : null}
          </form>
        </div>
      </section>
    </>
  );
}
