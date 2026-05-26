import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { activatePortalAccountApi, readErrorMessage } from "../lib/api";

export function PartnerActivatePage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const response = await activatePortalAccountApi({ token, password });
      setMessage(response.message);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to activate account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section page-top section-soft">
      <div className="container auth-container">
        <div className="auth-surface">
          <div className="section-heading section-heading-left auth-heading">
            <span className="section-badge">Portal Setup</span>
            <h2>Create Your Password</h2>
            <p>Set your password once. After this, use the partner portal login page.</p>
          </div>

          {!token ? <p className="form-message form-message-error">Activation token is missing.</p> : null}
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          {message ? <p className="form-message">{message}</p> : null}

          <form className="order-form auth-form" onSubmit={handleSubmit}>
            <div className="form-grid two-up">
              <label>
                New Password
                <input
                  type="password"
                  value={password}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="button button-primary" disabled={loading || !token}>
                {loading ? "Activating..." : "Activate Account"}
              </button>
              <Link className="button button-secondary" to="/partner/login">Go To Login</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
