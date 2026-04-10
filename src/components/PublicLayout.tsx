import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { name: "Home", type: "route", path: "/" },
  { name: "Products", type: "anchor", path: "/#products" },
  { name: "About", type: "anchor", path: "/#about" },
  { name: "Order Request", type: "route", path: "/order-request" },
  { name: "Track Order", type: "route", path: "/track-order" },
  { name: "Contact", type: "anchor", path: "/#contact" }
] as const;

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="site-shell">
      <nav className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
        <div className="container">
          <div className="navbar-row">
            <NavLink className="brand" to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="brand-mark brand-mark-image">
                <img src="/assets/logofvp.jpeg" alt="Pure Pick logo" />
              </span>
              <span className="brand-copy">
                <span className="brand-name">FVP Purepick</span>
                <span className="brand-subtitle">Agricultural Wholesale</span>
              </span>
            </NavLink>

            <div className="nav-links">
              {navLinks.map((link) => (
                link.type === "route"
                  ? (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      end={link.path === "/"}
                      className={({ isActive }) => navClass(isActive)}
                    >
                      {link.name}
                    </NavLink>
                  )
                  : (
                    <a key={link.name} href={link.path} className="nav-link">
                      {link.name}
                    </a>
                  )
              ))}
            </div>

            <button
              type="button"
              className="menu-toggle"
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? "X" : "="}
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
          <div className="container mobile-menu-inner">
            {navLinks.map((link) => (
              link.type === "route"
                ? (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    end={link.path === "/"}
                    className="mobile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                )
                : (
                  <a
                    key={link.name}
                    href={link.path}
                    className="mobile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )
            ))}
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

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
              Wholesale agricultural products for businesses and growers. Public website includes catalog,
              order request, and order tracking.
            </p>
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><NavLink to="/">Home</NavLink></li>
              <li><a href="/#products">Products</a></li>
              <li><a href="/#about">About</a></li>
              <li><NavLink to="/order-request">Order Request</NavLink></li>
              <li><NavLink to="/track-order">Track Order</NavLink></li>
              <li><a href="/#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Public Features</h3>
            <ul>
              <li><span>Product catalog</span></li>
              <li><span>Bulk order request</span></li>
              <li><span>Public order tracking</span></li>
              <li><span>Contact and support</span></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Contact Us</h3>
            <div className="contact-list">
              <a href="tel:+919311358420">+(91)-9311358420</a>
              <a href="mailto:contact@fvpurepick.com">contact@fvpurepick.com</a>
              <a className="button button-whatsapp" href="https://wa.me/9311358420" target="_blank" rel="noreferrer">
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-row">
            <span>Copyright 2026 FVP Purepick</span>
            <span>Public storefront only - admin moved to separate portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
