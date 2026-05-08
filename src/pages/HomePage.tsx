import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readErrorMessage, submitLeadApi } from "../lib/api";
import type { Product } from "../types/domain";

const serviceCards = [
  ["Seeds", "High-quality seeds for cereals, grains, vegetables, fruits, and legumes."],
  ["Fertilizers", "Organic and chemical fertilizers selected for performance and soil compatibility."],
  ["Pesticides and Insecticides", "Crop protection products chosen for safety, compliance, and efficacy."],
  ["Animal Feed", "Nutritious feed options for cattle, poultry, and other livestock."],
  ["Agricultural Tools and Equipment", "Essential hand tools, power tools, and machinery support products."],
  ["Food Products", "Wholesale grains, pulses, spices, and selected processed food items."]
] as const;

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
              <span className="eyebrow">Wholesale sourcing for modern agriculture businesses</span>
              <h1>
                Premium Wholesale
                <span>Agricultural Products</span>
              </h1>
              <p className="hero-lead">
                Discover catalog products, submit bulk order requests, join investor programs, and onboard as a
                farming partner from one public experience.
              </p>
              <div className="hero-feature-list">
                {["Live product catalog", "Investor onboarding", "Farmer registration", "My account order history"].map((item) => (
                  <div key={item} className="hero-feature-item">
                    <span className="hero-check">OK</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="hero-actions hero-actions-uniform">
                <Link className="button button-primary button-large hero-cta" to="/join-us?type=investor">Buy / Invest Now</Link>
                <Link className="button button-primary button-large hero-cta" to="/join-us?type=farmer">Join as Farmer</Link>
                <Link className="button button-primary button-large hero-cta" to="/shop">Shop & Checkout</Link>
                <Link className="button button-primary button-large hero-cta" to="/portal/login">My Account</Link>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-panel-glow" />
              <div className="hero-panel-card">
                <img src="/assets/hero-card.jpg" alt="Fresh Produce" />
                <div className="hero-panel-copy">
                    <h3>Public Experience</h3>
                    <div className="hero-panel-list">
                    {["Catalog browsing", "Investor and farmer intake", "Order request and account history", "Marketing and contact pages"].map((item) => (
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
            <h2>Wholesale Agricultural Products</h2>
            <p>Featured categories below link to full dynamic shop catalog.</p>
          </div>

          <div className="product-grid">
            {productCards.map((product, index) => (
              <Link key={product.id} to={`/shop?category=${encodeURIComponent(product.category)}`} className="product-card-link">
                <article className="product-card">
                  <div className="product-media">
                    <div className={`product-wash ${index % 3 === 0 ? "product-wash-green" : index % 3 === 1 ? "product-wash-emerald" : "product-wash-teal"}`} />
                    <img src={product.imageUrl ?? "/assets/product-seeds.jpg"} alt={product.name} />
                    <div className={`product-icon ${index % 3 === 0 ? "product-icon-green" : index % 3 === 1 ? "product-icon-emerald" : "product-icon-teal"}`}>
                      {product.name.charAt(0)}
                    </div>
                  </div>
                  <div className="product-body">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription}</p>
                  </div>
                </article>
              </Link>
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
