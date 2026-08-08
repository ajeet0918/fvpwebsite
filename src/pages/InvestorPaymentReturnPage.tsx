import { Link } from "react-router-dom";

export function InvestorPaymentReturnPage() {
  return (
    <section className="section page-top section-soft">
      <div className="container auth-container">
        <div className="auth-surface">
          <div className="section-heading section-heading-left auth-heading">
            <span className="section-badge">Investment Payment</span>
            <h2>Your payment response has been received</h2>
            <p>
              We are verifying the payment securely with Cashfree. When confirmation is complete, we will email your
              partner portal activation link. Your investment agreement will be available in the portal after activation.
            </p>
          </div>
          <p className="form-message">
            Please check your inbox and spam folder. Payment confirmation can take a few minutes in some banking flows.
          </p>
          <div className="form-actions">
            <Link className="button button-primary" to="/partner/login">Partner Portal Login</Link>
            <Link className="button button-secondary" to="/">Return Home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
