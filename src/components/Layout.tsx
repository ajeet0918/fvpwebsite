import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/quote", label: "Request Quote" },
  { to: "/contact", label: "Contact" }
];

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Agriculture Wholesale Platform</p>
          <NavLink to="/" className="brand">
            Verdant Harvest Supply
          </NavLink>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div>
          <p className="eyebrow">Trusted by growers, distributors, and agri businesses</p>
          <h3>Built for bulk product discovery and inquiry-led sales.</h3>
        </div>
        <div className="footer-meta">
          <p>hello@verdantharvest.com</p>
          <p>+91 9650035272</p>
        </div>
      </footer>
    </div>
  );
}
