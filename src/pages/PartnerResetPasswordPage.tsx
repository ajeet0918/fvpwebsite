import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { changePortalPasswordApi, readErrorMessage, resetPortalPasswordWithTokenApi } from "../lib/api";
import {
  clearPortalPasswordResetRequired,
  isPortalAuthenticated,
  isPortalPasswordResetRequired
} from "../lib/portalAuth";

export function PartnerResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      const response = token
        ? await resetPortalPasswordWithTokenApi({ token, password })
        : await changePortalPasswordApi({ password });
      clearPortalPasswordResetRequired();
      setMessage(response.message);
      if (!token) {
        navigate("/partner", { replace: true });
      }
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to reset password."));
    } finally {
      setLoading(false);
    }
  }

  if (!token && !isPortalAuthenticated()) {
    return <Navigate to="/partner/login?next=/partner/reset-password" replace />;
  }

  return (
    <section className="section page-top section-soft">
      <div className="container auth-container">
        <div className="auth-surface">
          <div className="section-heading section-heading-left auth-heading">
            <span className="section-badge">Password Reset</span>
            <h2>Set New Portal Password</h2>
            <p>Create a new password before continuing to your farmer, investor, or collection hub dashboard.</p>
          </div>

          {!token && isPortalPasswordResetRequired() ? (
            <p className="form-message">Your account is using a temporary password. Set a new password to continue.</p>
          ) : null}
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
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Password"}
              </button>
              {token ? <Link className="button button-secondary" to="/partner/login">Go To Login</Link> : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
