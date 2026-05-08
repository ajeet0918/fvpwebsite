import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { key: "home", name: "Home", type: "route", path: "/" },
  { key: "about", name: "About", type: "anchor", path: "/#about", sectionId: "about" },
  { key: "contact", name: "Contact", type: "anchor", path: "/#contact", sectionId: "contact" },
  { key: "join", name: "Join With Us", type: "route", path: "/join-us" },
  { key: "products", name: "Shop", type: "route", path: "/shop" },
  { key: "checkout", name: "Checkout", type: "route", path: "/checkout" },
  { key: "portal", name: "My Account", type: "route", path: "/portal/login" }
] as const;

export function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    const navOffset = 96;
    const y = target.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, y), behavior });
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const sectionOrder = ["contact", "about"] as const;
    const detectSection = () => {
      const offsetY = window.scrollY + 140;
      const found = sectionOrder.find((sectionId) => {
        const element = document.getElementById(sectionId);
        if (!element) return false;
        return offsetY >= element.offsetTop;
      });
      setActiveSection(found ?? "home");
    };

    detectSection();
    window.addEventListener("scroll", detectSection);
    window.addEventListener("hashchange", detectSection);
    return () => {
      window.removeEventListener("scroll", detectSection);
      window.removeEventListener("hashchange", detectSection);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) {
      return;
    }
    const sectionId = location.hash.replace("#", "");
    if (!sectionId) {
      return;
    }

    const timer = window.setTimeout(() => {
      scrollToSection(sectionId, "smooth");
      setActiveSection(sectionId);
    }, 40);

    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  const activeKey = useMemo(() => {
    if (location.pathname === "/") {
      if (location.hash === "#about") return "about";
      if (location.hash === "#contact") return "contact";
      return activeSection;
    }
    if (location.pathname.startsWith("/shop")) return "products";
    if (location.pathname.startsWith("/join-us")) return "join";
    if (location.pathname.startsWith("/checkout")) return "checkout";
    if (location.pathname.startsWith("/portal")) return "portal";
    return "";
  }, [activeSection, location.hash, location.pathname]);

  function navClass(linkKey: string) {
    return activeKey === linkKey ? "nav-link nav-link-active" : "nav-link";
  }

  function handleHomeClick(event?: MouseEvent<HTMLAnchorElement>) {
    const isAlreadyHomeTop = location.pathname === "/" && !location.hash;
    if (isAlreadyHomeTop && event) {
      event.preventDefault();
    }

    setIsMobileMenuOpen(false);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) {
    event.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === "/") {
      navigate({ pathname: "/", hash: `#${sectionId}` }, { replace: false });
      scrollToSection(sectionId, "smooth");
      setActiveSection(sectionId);
      return;
    }

    navigate({ pathname: "/", hash: `#${sectionId}` }, { replace: false });
  }

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
                      key={link.key}
                      to={link.path}
                      end={link.path === "/"}
                      className={navClass(link.key)}
                      onClick={link.key === "home" ? handleHomeClick : () => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </NavLink>
                  )
                  : (
                    <a
                      key={link.key}
                      href={link.path}
                      className={navClass(link.key)}
                      onClick={(event) => handleSectionClick(event, link.sectionId)}
                    >
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
                    key={link.key}
                    to={link.path}
                    end={link.path === "/"}
                    className={activeKey === link.key ? "mobile-link nav-link-active" : "mobile-link"}
                    onClick={link.key === "home" ? handleHomeClick : () => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                )
                : (
                  <a
                    key={link.key}
                    href={link.path}
                    className={activeKey === link.key ? "mobile-link nav-link-active" : "mobile-link"}
                    onClick={(event) => handleSectionClick(event, link.sectionId)}
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
              direct checkout, and account-based order history.
            </p>
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><NavLink to="/">Home</NavLink></li>
              <li><NavLink to="/shop">Shop</NavLink></li>
              <li><a href="/#about">About</a></li>
              <li><a href="/#contact">Contact</a></li>
              <li><NavLink to="/join-us">Join With Us</NavLink></li>
              <li><NavLink to="/checkout">Checkout</NavLink></li>
              <li><NavLink to="/portal/login">My Account</NavLink></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Public Features</h3>
            <ul>
              <li><span>Product catalog</span></li>
              <li><span>Investor onboarding</span></li>
              <li><span>Farmer registration</span></li>
              <li><span>Email/Google account login</span></li>
              <li><span>Direct order checkout</span></li>
              <li><span>Order history in account</span></li>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
