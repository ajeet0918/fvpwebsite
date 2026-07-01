import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readErrorMessage, submitLeadApi } from "../lib/api";
import type { Product } from "../types/domain";
import { setProductImageFallback } from "../data/productImages";

const WHATSAPP_URL = "https://wa.me/919650035272?text=I%20want%20a%20bulk%20quote%20from%20FVP%20Purepick.";

const serviceCards = [
  ["Bulk Vegetables", "Fresh produce and staples sourced for retailers, kitchens, and local distribution."],
  ["Seeds", "High-quality seed stock for cereals, grains, vegetables, fruits, and legumes."],
  ["Fertilizers", "Organic and chemical fertilizers selected for performance and soil compatibility."],
  ["Crop Protection", "Pesticides and insecticides selected for practical farm-use requirements."],
  ["Farm Supplies", "Essential tools, equipment, packaging, and day-to-day field support products."],
  ["Food Staples", "Wholesale grains, pulses, spices, and selected processed food items."]
] as const;

const heroProofItems = [
  "Bulk vegetables, seeds, fertilizers, and farm supplies",
  "MOQ shown before checkout or quote discussion",
  "Delivery coverage confirmed before dispatch",
  "WhatsApp quote support for urgent buyer requirements"
];

const staticProductCards: Product[] = [
  {
    id: 1,
    name: "Premium Wheat Seeds",
    slug: "premium-wheat-seeds",
    sku: "SEED-WHEAT-001",
    price: null,
    priceUnit: "Per Kg",
    status: "ACTIVE",
    imageUrl: "/assets/product-seeds.jpg",
    shortDescription: "High-germination wheat seeds designed for strong yield and healthy crop establishment.",
    longDescription: "Suitable for wholesale farm requirements with quality-tested batches and reliable sourcing.",
    moq: "100 Kg",
    featured: true,
    category: "Seeds"
  },
  {
    id: 2,
    name: "Organic Growth Fertilizer",
    slug: "organic-growth-fertilizer",
    sku: "FERT-ORG-001",
    price: null,
    priceUnit: "Per Bag",
    status: "ACTIVE",
    imageUrl: "/assets/product-fertilizer.jpg",
    shortDescription: "Balanced nutrient blend to support root strength, growth consistency, and soil health.",
    longDescription: "Ideal for bulk farming programs that require stable product quality across seasons.",
    moq: "50 Bags",
    featured: true,
    category: "Fertilizers"
  },
  {
    id: 3,
    name: "Field Spray Equipment Kit",
    slug: "field-spray-equipment-kit",
    sku: "EQP-SPRAY-001",
    price: null,
    priceUnit: "Per Unit",
    status: "ACTIVE",
    imageUrl: "/assets/product-equipment.jpg",
    shortDescription: "Durable spraying kit for crop protection workflows and day-to-day field operations.",
    longDescription: "Built for practical usage in wholesale and agri-operational environments.",
    moq: "10 Units",
    featured: true,
    category: "Agricultural Tools and Equipment"
  },
  {
    id: 4,
    name: "Crop Protection Mix",
    slug: "crop-protection-mix",
    sku: "PEST-CROP-001",
    price: null,
    priceUnit: "Per Box",
    status: "ACTIVE",
    imageUrl: "/assets/product-equipment.jpg",
    shortDescription: "Farm-safe pesticide and insecticide selection for preventive and responsive usage.",
    longDescription: "Compliance-oriented crop protection products selected for efficacy and reliability.",
    moq: "25 Boxes",
    featured: false,
    category: "Pesticides and Insecticides"
  },
  {
    id: 5,
    name: "Nutri Animal Feed",
    slug: "nutri-animal-feed",
    sku: "FEED-ANIMAL-001",
    price: null,
    priceUnit: "Per Bag",
    status: "ACTIVE",
    imageUrl: "/assets/product-fertilizer.jpg",
    shortDescription: "Nutrient-focused feed solutions for livestock productivity and health support.",
    longDescription: "Sourced through trusted suppliers for consistent wholesale availability.",
    moq: "40 Bags",
    featured: false,
    category: "Animal Feed"
  },
  {
    id: 6,
    name: "Wholesale Grains and Pulses",
    slug: "wholesale-grains-pulses",
    sku: "FOOD-GRAIN-001",
    price: null,
    priceUnit: "Per Quintal",
    status: "ACTIVE",
    imageUrl: "/assets/product-seeds.jpg",
    shortDescription: "Bulk-grade grains, pulses, and staples for retailers and distribution channels.",
    longDescription: "Stable sourcing network for food-product wholesale requirements.",
    moq: "20 Quintals",
    featured: false,
    category: "Food Products"
  }
];

function getCardAvailability(product: Product) {
  if (product.status !== "ACTIVE") {
    return "Check availability";
  }

  return product.featured ? "Featured supply item" : "Available for inquiry";
}

export function HomePage() {
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);

  const productCards = useMemo(() => staticProductCards, []);

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
              <span className="eyebrow">Wholesale agriculture supply for serious buyers</span>
              <h1>
                Bulk Farm Products
                <span>Quoted With Clarity</span>
              </h1>
              <p className="hero-lead">
                Source vegetables, seeds, fertilizers, and farm supplies with MOQ-led catalog browsing,
                delivery coordination, and quick WhatsApp quote support.
              </p>
              <div className="hero-feature-list">
                {heroProofItems.map((item) => (
                  <div key={item} className="hero-feature-item">
                    <span className="hero-check">OK</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="hero-actions hero-actions-uniform">
                <Link className="button button-primary button-large hero-cta hero-cta-primary" to="/shop">Shop Catalog</Link>
                <Link className="button button-light button-large hero-cta" to="/checkout">Request Bulk Quote</Link>
                <a className="button button-whatsapp button-large hero-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp Us</a>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-panel-glow" />
              <div className="hero-panel-card">
                <img src="/assets/hero-card.jpg" alt="Fresh Produce" />
                <div className="hero-panel-copy">
                    <h3>Buyer Desk</h3>
                    <div className="hero-panel-list">
                    {["Bulk quote before dispatch", "MOQ and packaging discussion", "Fresh produce and farm-input sourcing", "Phone, email, and WhatsApp support"].map((item) => (
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

      <section id="products" className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Our Products</span>
            <h2>Wholesale Categories Buyers Actually Ask For</h2>
            <p>Start from common supply categories, then confirm grade, packaging, and delivery coverage with our team.</p>
          </div>

          <div className="product-grid">
            {productCards.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-media">
                    <div className="product-wash product-wash-green" />
                    <img
                      src={product.imageUrl ?? "/assets/product-seeds.jpg"}
                      alt={product.name}
                      onError={(event) => setProductImageFallback(event.currentTarget, product)}
                    />
                    <span className="product-status-badge">{getCardAvailability(product)}</span>
                  </div>
                  <div className="product-body">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription}</p>
                    <div className="product-card-meta">
                      <span>MOQ: {product.moq}</span>
                      <span>{product.price ? "Rate listed" : "Quote before order"}</span>
                    </div>
                    <div className="shop-card-actions">
                      <Link className="button button-secondary button-small" to={`/shop?category=${encodeURIComponent(product.category)}`}>View Catalog</Link>
                      <a className="button button-primary button-small" href={`${WHATSAPP_URL}%20Category:%20${encodeURIComponent(product.category)}`} target="_blank" rel="noreferrer">
                        Get Bulk Quote
                      </a>
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
            <h2>How FVP Purepick Handles Wholesale Supply</h2>
            <p>
              We keep the buying process practical: confirm requirement, check source and packaging,
              coordinate delivery, and keep the buyer informed before dispatch.
            </p>
          </div>

          <div className="about-layout">
            <article className="about-card">
              <h3>Quality Check Process</h3>
              <p>
                Product grade, packaging, MOQ, and current availability are checked before final quote sharing.
                For fresh produce, buyer expectations are confirmed before dispatch.
              </p>
            </article>

            <article className="about-card">
              <h3>Sourcing and Farmer Network</h3>
              <p>
                The website supports farmer and collection-hub onboarding so FVP Purepick can build cleaner
                supply visibility over time.
              </p>
            </article>

            <article className="about-card">
              <h3>Delivery Coordination</h3>
              <p>
                Delivery area, dispatch timing, packaging size, and unloading expectations are confirmed during
                the quote process. Exact service zones should be updated by the owner.
              </p>
            </article>

            <article className="about-card">
              <h3>Support Process</h3>
              <ul className="about-list">
                <li>Catalog inquiry through shop, checkout, phone, or WhatsApp</li>
                <li>MOQ and price confirmation before buyer commitment</li>
                <li>Order notes captured for packaging and delivery requirements</li>
                <li>Account login available for checkout and order history</li>
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

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Programs</span>
            <h2>Investor, Farmer, and Collection Hub Programs</h2>
            <p>Choose the journey that fits your role in the FVP Purepick ecosystem.</p>
          </div>
          <div className="service-grid">
            <article className="service-card">
              <div className="service-icon">I</div>
              <h3>Investor Intake</h3>
              <p>Register investment intent and KYC details first; payment is handled after verification.</p>
              <p><Link to="/join-us?type=investor">Open investor form</Link></p>
            </article>
            <article className="service-card">
              <div className="service-icon">F</div>
              <h3>Farmer Onboarding</h3>
              <p>Share farm profile, crop details, and required documents for partner onboarding.</p>
              <p><Link to="/join-us?type=farmer">Open farmer form</Link></p>
            </article>
            <article className="service-card">
              <div className="service-icon">C</div>
              <h3>Collection Hub Setup</h3>
              <p>Open a local collection point and onboard for procurement, grading, and dispatch coordination.</p>
              <p><Link to="/join-us?type=collection-hub">Open collection hub form</Link></p>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Contact</span>
            <h2>Request a Wholesale Call Back</h2>
            <p>Share your name, email, and phone number. For urgent rates or Fresh Potato inquiries, use WhatsApp.</p>
          </div>
          <div className="contact-action-row">
            <a className="button button-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp Bulk Quote</a>
            <a className="button button-secondary" href="tel:+919650035272">Call +91 9650035272</a>
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
