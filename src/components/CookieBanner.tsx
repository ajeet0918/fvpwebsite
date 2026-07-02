import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const COOKIE_ACCEPTANCE_KEY = "fvp-cookie-policy-accepted";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(COOKIE_ACCEPTANCE_KEY) !== "true");
  }, []);

  function acceptCookies() {
    window.localStorage.setItem(COOKIE_ACCEPTANCE_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie notice">
      <div>
        <strong>Cookie Notice</strong>
        <p>
          We use essential and optional cookies to support website functionality, security,
          analytics, and buyer experience.
        </p>
      </div>
      <div className="cookie-banner-actions">
        <Link className="button button-secondary button-small" to="/policies#cookie">
          View Cookie Policy
        </Link>
        <button type="button" className="button button-primary button-small" onClick={acceptCookies}>
          Accept
        </button>
      </div>
    </div>
  );
}
