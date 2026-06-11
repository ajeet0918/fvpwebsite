import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  portalLoginApi,
  readErrorMessage,
  requestPortalPasswordResetApi
} from "../lib/api";
import { setPortalAccessToken } from "../lib/portalAuth";

export function PartnerLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = username.trim();
    if (!identifier || !password) {
      setMessage("Enter your username and password.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await portalLoginApi({
        username: identifier,
        password
      });
      setPortalAccessToken(response.accessToken);
      const next = searchParams.get("next");
      navigate(next && next.startsWith("/") ? next : "/partner", { replace: true });
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to login."));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = resetIdentifier.trim();
    if (!identifier) {
      setMessage("Enter your email or username.");
      return;
    }
    setResetting(true);
    setMessage(null);
    try {
      const response = await requestPortalPasswordResetApi({ identifier });
      setMessage(response.message);
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to request password reset."));
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="auth-page auth-page-partner">
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
              <span className="auth-kicker">Partner portal</span>
              <h1>Partner sign in</h1>
              <p>Access approved farmer, investor, and collection partner tools.</p>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field-stack">
                <label htmlFor="partner-identifier">
                  Username, email, or phone
                  <input
                    id="partner-identifier"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
                <label htmlFor="partner-password">
                  Password
                  <div className="password-input-wrap">
                    <input
                      id="partner-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M3 4.27 4.28 3 21 19.72 19.73 21l-2.6-2.6A11.8 11.8 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 2-3.88 3.62-5.32L3 4.27Zm9 1.73c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.66 4.07l-2.2-2.2A8.54 8.54 0 0 0 20.86 12C19.22 8.23 15.83 6 12 6c-1.43 0-2.8.31-4.04.88L6.43 5.35A11.8 11.8 0 0 1 12 6Z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M12 5c5 0 9.27 3.11 11 8-1.73 4.89-6 8-11 8S2.73 17.89 1 13c1.73-4.89 6-8 11-8Zm0 2C8.17 7 4.78 9.23 3.14 13 4.78 16.77 8.17 19 12 19s7.22-2.23 8.86-6C19.22 9.23 15.83 7 12 7Zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Z" fill="currentColor"/>
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

            <form className="auth-reset-form" onSubmit={handleReset}>
              <div className="auth-reset-heading">
                <h2>Reset access</h2>
                <span>Use your email or username.</span>
              </div>
              <label htmlFor="partner-reset-identifier">
                Email or username
                <input
                  id="partner-reset-identifier"
                  value={resetIdentifier}
                  onChange={(event) => setResetIdentifier(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <button type="submit" className="button button-secondary" disabled={resetting}>
                {resetting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {message ? <p className="form-message" role="status" aria-live="polite">{message}</p> : null}

            <div className="auth-footer-switch">
              <span>Shopping or tracking an order?</span>
              <Link to="/portal/login">Use customer login</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
