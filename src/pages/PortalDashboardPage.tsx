import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { fetchPortalSummaryApi, readErrorMessage } from "../lib/api";
import { clearPortalAccessToken, isPortalAuthenticated } from "../lib/portalAuth";
import type { PortalSummary } from "../types/domain";

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PortalDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setSummary(await fetchPortalSummaryApi());
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load portal summary."));
      } finally {
        setLoading(false);
      }
    }
    void loadSummary();
  }, []);

  if (!isPortalAuthenticated()) {
    return <Navigate to="/portal/login" replace />;
  }

  const hasOrders = Boolean(summary && summary.orders.length > 0);
  const hasInvestors = Boolean(summary && summary.investors.length > 0);
  const hasFarmers = Boolean(summary && summary.farmers.length > 0);
  const visibleSectionCount = [hasOrders, hasInvestors, hasFarmers].filter(Boolean).length;

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">My Portal</span>
          <h2>Welcome Back</h2>
          <p>View your order journey, investment profile, and farmer activity updates.</p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                clearPortalAccessToken();
                navigate("/portal/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {loading ? <p>Loading portal data...</p> : null}

        {summary ? (
          <>
            <div className="stats-band portal-stats-band">
              {hasOrders ? (
                <article className="stats-item">
                  <strong>{summary.orderCount}</strong>
                  <span>Total Orders</span>
                </article>
              ) : null}
              {hasInvestors ? (
                <>
                  <article className="stats-item">
                    <strong>{formatCurrency(summary.totalInvested)}</strong>
                    <span>Total Invested</span>
                  </article>
                  <article className="stats-item">
                    <strong>{formatCurrency(summary.totalCommittedReturn)}</strong>
                    <span>Committed Return</span>
                  </article>
                </>
              ) : null}
              <article className="stats-item stats-item-identifier">
                <strong>{summary.identifier}</strong>
                <span>Login Identifier</span>
              </article>
            </div>

            <div className="section">
              {visibleSectionCount === 0 ? (
                <article className="tracking-panel">
                  <h3>Profile Under Review</h3>
                  <p>
                    Account access is active, but no records are available yet.
                    Create an order request or wait for profile submission updates.
                  </p>
                </article>
              ) : null}

              {hasOrders ? (
                <article className="tracking-panel portal-panel">
                  <h3>Order History</h3>
                  {summary.orders.map((order) => (
                    <div key={order.id} className="tracking-item-row">
                      <span>
                        {order.orderNumber} ({order.status})<br />
                        <small>{formatDate(order.createdAt)}</small>
                      </span>
                      <strong>
                        {order.totalAmount ? formatCurrency(order.totalAmount, order.currency) : "Pending"}
                      </strong>
                      <Link className="button button-secondary button-small" to={`/invoice/${order.orderNumber}`}>
                        Invoice
                      </Link>
                    </div>
                  ))}
                </article>
              ) : null}

              {hasInvestors ? (
                <article className="tracking-panel portal-panel">
                  <h3>Investor Profile</h3>
                  {summary.investors.map((item) => (
                    <div key={item.id} className="tracking-item-row">
                      <span>
                        {item.referenceId ?? "N/A"} ({item.verificationStatus})<br />
                        <small>Payment: {item.paymentStatus} | {formatDate(item.createdAt)}</small>
                      </span>
                      <strong>
                        {item.investmentAmount ? formatCurrency(item.investmentAmount) : "Pending"}
                        <br />
                        <small>
                          Return: {item.committedReturnAmount ? formatCurrency(item.committedReturnAmount) : "Pending"}
                        </small>
                      </strong>
                    </div>
                  ))}
                </article>
              ) : null}

              {hasFarmers ? (
                <article className="tracking-panel portal-panel">
                  <h3>Farmer Profile</h3>
                  {summary.farmers.map((item) => (
                    <div key={item.id} className="tracking-item-row">
                      <span>
                        {item.referenceId ?? "N/A"} ({item.verificationStatus})<br />
                        <small>{item.mainCrops ?? "-"} | {item.landArea ?? "-"} | {formatDate(item.createdAt)}</small>
                      </span>
                      <strong>{item.farmerActionNote ?? "No action assigned yet"}</strong>
                    </div>
                  ))}
                </article>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
