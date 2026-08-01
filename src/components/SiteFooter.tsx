import { NavLink } from "react-router-dom";
import { policyLinks } from "../data/policies";

type SiteFooterProps = {
  compact?: boolean;
};

export function SiteFooter({ compact = false }: SiteFooterProps) {
  if (compact) {
    return (
      <footer className="footer footer-compact">
        <div className="container footer-compact-row">
          <span>Copyright 2026 FVP Purepick</span>
          <nav aria-label="Buyer support links">
            <NavLink to="/policies#terms">Terms</NavLink>
            <NavLink to="/policies#privacy">Privacy</NavLink>
            <NavLink to="/policies#shipping-delivery">Delivery</NavLink>
            <a href="mailto:contact@fvpurepick.com">Support</a>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-column footer-brand-column">
          <NavLink className="brand brand-footer" to="/">
            <span className="brand-mark brand-mark-image">
              <img src="/assets/logofvp.jpeg" alt="Pure Pick logo" />
            </span>
            <span className="brand-copy">
              <span className="brand-name">FVP Purepick</span>
              <span className="brand-subtitle">Agricultural Wholesale</span>
            </span>
          </NavLink>
          <p>
            Wholesale agricultural products for businesses and growers, with clear buyer policies and support.
          </p>
        </div>

        <div className="footer-column">
          <h3>Legal</h3>
          <ul className="footer-legal-list">
            {policyLinks.map((policy) => (
              <li key={policy.slug}>
                <NavLink to={`/policies#${policy.slug}`}>{policy.title}</NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3>Contact Us</h3>
          <div className="contact-list">
            <a href="tel:+919650035272">+(91)-9650035272</a>
            <a href="mailto:contact@fvpurepick.com">contact@fvpurepick.com</a>
            <a className="button button-whatsapp" href="https://wa.me/919650035272" target="_blank" rel="noreferrer">
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-row">
          <span>Copyright 2026 FVP Purepick</span>
        </div>
      </div>
    </footer>
  );
}
