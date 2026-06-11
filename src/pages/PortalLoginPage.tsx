import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  customerGoogleAuthApi,
  customerLoginApi,
  customerSignupApi,
  readErrorMessage
} from "../lib/api";
import { setCustomerAccessToken } from "../lib/customerAuth";

type AuthMode = "login" | "signup";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function PortalLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const redirectPath = useMemo(() => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/")) {
      return next;
    }
    return "/portal";
  }, [searchParams]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const scriptId = "google-identity-service";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      document.head.appendChild(script);
    }

    const timer = window.setInterval(() => {
      if (!window.google || !googleClientId) {
        return;
      }

      const mount = document.getElementById("google-auth-button");
      if (!mount) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            return;
          }
          setLoading(true);
          setMessage(null);
          try {
            const auth = await customerGoogleAuthApi(response.credential);
            setCustomerAccessToken(auth.accessToken);
            navigate(redirectPath, { replace: true });
          } catch (error) {
            setMessage(readErrorMessage(error, "Google login failed."));
          } finally {
            setLoading(false);
          }
        }
      });

      mount.innerHTML = "";
      window.google.accounts.id.renderButton(mount, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 280
      });
      window.clearInterval(timer);
    }, 400);

    return () => window.clearInterval(timer);
  }, [navigate, redirectPath]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setMessage("Enter your email and password.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await customerLoginApi({
        email,
        password: loginPassword
      });
      setCustomerAccessToken(response.accessToken);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to login."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = signupName.trim();
    const email = signupEmail.trim();
    const phone = signupPhone.trim();
    if (!fullName || !email || !phone || !signupPassword) {
      setMessage("Complete the required account details.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await customerSignupApi({
        fullName,
        companyName: signupCompany.trim() || undefined,
        email,
        phone,
        password: signupPassword
      });
      setCustomerAccessToken(response.accessToken);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page auth-page-customer">
      <div className="container auth-container">
        <div className="auth-shell">
          <div className="auth-brand">
            <Link className="auth-logo" to="/" aria-label="FVP Purepick home">
              <img src="/assets/logofvp.jpeg" alt="" />
            </Link>
            <span>FVP Purepick</span>
          </div>

          <div className="auth-surface auth-card">
            <div className="auth-heading">
              <span className="auth-kicker">Customer account</span>
              <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
              <p>{mode === "login" ? "Access your orders, invoices, and checkout details." : "Create one secure account for orders and checkout."}</p>
            </div>

            <div className="auth-mode-toggle" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                className={mode === "login" ? "auth-toggle-button auth-toggle-active" : "auth-toggle-button"}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "signup" ? "auth-toggle-button auth-toggle-active" : "auth-toggle-button"}
                onClick={() => setMode("signup")}
              >
                Signup
              </button>
            </div>

            {mode === "login" ? (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="auth-field-stack">
                  <label htmlFor="customer-login-email">
                    Email
                    <input
                      id="customer-login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="name@company.com"
                      required
                    />
                  </label>
                  <label htmlFor="customer-login-password">
                    Password
                    <div className="password-input-wrap">
                      <input
                        id="customer-login-password"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-button"
                        onClick={() => setShowLoginPassword((current) => !current)}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        title={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path d="M3 4.27 4.28 3 21 19.72 19.73 21l-2.6-2.6A11.8 11.8 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 2-3.88 3.62-5.32L3 4.27Zm6.5 6.5 4.23 4.23A3.95 3.95 0 0 1 12 15.5 4 4 0 0 1 8 11.5c0-.64.15-1.24.42-1.73L9.5 10.77ZM12 6c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.66 4.07l-2.2-2.2A8.54 8.54 0 0 0 20.86 12C19.22 8.23 15.83 6 12 6c-1.43 0-2.8.31-4.04.88L6.43 5.35A11.8 11.8 0 0 1 12 6Z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path d="M12 5c5 0 9.27 3.11 11 8-1.73 4.89-6 8-11 8S2.73 17.89 1 13c1.73-4.89 6-8 11-8Zm0 2C8.17 7 4.78 9.23 3.14 13 4.78 16.77 8.17 19 12 19s7.22-2.23 8.86-6C19.22 9.23 15.83 7 12 7Zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Zm0 2A1.5 1.5 0 1 0 13.5 13 1.5 1.5 0 0 0 12 11.5Z" fill="currentColor"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                </div>
                <button type="submit" className="button button-primary auth-submit" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignupSubmit}>
                <div className="form-grid two-up auth-signup-grid">
                  <label htmlFor="customer-signup-name">
                    Full name
                    <input
                      id="customer-signup-name"
                      value={signupName}
                      onChange={(event) => setSignupName(event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label htmlFor="customer-signup-company">
                    Company name
                    <input
                      id="customer-signup-company"
                      value={signupCompany}
                      onChange={(event) => setSignupCompany(event.target.value)}
                      autoComplete="organization"
                      placeholder="Optional"
                    />
                  </label>
                  <label htmlFor="customer-signup-email">
                    Email
                    <input
                      id="customer-signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label htmlFor="customer-signup-phone">
                    Phone
                    <input
                      id="customer-signup-phone"
                      value={signupPhone}
                      onChange={(event) => setSignupPhone(event.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                  </label>
                  <label className="auth-wide-field" htmlFor="customer-signup-password">
                    Password
                    <div className="password-input-wrap">
                      <input
                        id="customer-signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-button"
                        onClick={() => setShowSignupPassword((current) => !current)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        title={showSignupPassword ? "Hide password" : "Show password"}
                      >
                        {showSignupPassword ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path d="M3 4.27 4.28 3 21 19.72 19.73 21l-2.6-2.6A11.8 11.8 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 2-3.88 3.62-5.32L3 4.27Zm6.5 6.5 4.23 4.23A3.95 3.95 0 0 1 12 15.5 4 4 0 0 1 8 11.5c0-.64.15-1.24.42-1.73L9.5 10.77ZM12 6c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.66 4.07l-2.2-2.2A8.54 8.54 0 0 0 20.86 12C19.22 8.23 15.83 6 12 6c-1.43 0-2.8.31-4.04.88L6.43 5.35A11.8 11.8 0 0 1 12 6Z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path d="M12 5c5 0 9.27 3.11 11 8-1.73 4.89-6 8-11 8S2.73 17.89 1 13c1.73-4.89 6-8 11-8Zm0 2C8.17 7 4.78 9.23 3.14 13 4.78 16.77 8.17 19 12 19s7.22-2.23 8.86-6C19.22 9.23 15.83 7 12 7Zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Zm0 2A1.5 1.5 0 1 0 13.5 13 1.5 1.5 0 0 0 12 11.5Z" fill="currentColor"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                </div>
                <button type="submit" className="button button-primary auth-submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}

            {googleClientId ? (
              <div className="google-auth-panel">
                <span>Or continue with Google</span>
                <div id="google-auth-button" />
              </div>
            ) : null}

            {message ? <p className="form-message form-message-error" role="status" aria-live="polite">{message}</p> : null}

            <div className="auth-footer-switch">
              <span>Farmer, investor, or collection partner?</span>
              <Link to="/partner/login">Use partner login</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
