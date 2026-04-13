import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readErrorMessage, requestPortalOtpApi, verifyPortalOtpApi } from "../lib/api";
import { setPortalAccessToken } from "../lib/portalAuth";

export function PortalLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await requestPortalOtpApi({ identifier: identifier.trim() });
      setOtpRequested(true);
      setDevOtp(response.devOtp ?? null);
      setMessage(response.message);
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to request OTP."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await verifyPortalOtpApi({
        identifier: identifier.trim(),
        otp: otp.trim()
      });
      setPortalAccessToken(response.accessToken);
      navigate("/portal", { replace: true });
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to verify OTP."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section page-top section-soft">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Customer Portal</span>
          <h2>Login With OTP</h2>
          <p>Use your registered mobile number (or email) right after order request to view history and updates.</p>
        </div>

        <form className="order-form" onSubmit={handleRequestOtp}>
          <div className="form-grid two-up">
            <label>
              Email or Phone
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="+91... (mobile preferred) or email"
                required
              />
            </label>
            <div className="form-actions form-grid-action">
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? "Requesting..." : "Request OTP"}
              </button>
            </div>
          </div>
        </form>

        {otpRequested ? (
          <form className="order-form" onSubmit={handleVerifyOtp}>
            <div className="form-grid two-up">
              <label>
                Enter OTP
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6-digit OTP"
                  required
                />
              </label>
              <div className="form-actions form-grid-action">
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              </div>
            </div>
            {devOtp ? <p className="form-message">Dev OTP: {devOtp}</p> : null}
          </form>
        ) : null}

        {message ? <p className="form-message">{message}</p> : null}
      </div>
    </section>
  );
}
