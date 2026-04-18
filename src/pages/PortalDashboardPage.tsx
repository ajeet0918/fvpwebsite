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

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">My Portal</span>
          <h2>Welcome Back</h2>
          <p>View your order journey, investment returns, payout status, and downloadable receipts.</p>
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
              <article className="stats-item">
                <strong>{formatCurrency(summary.totalInvested)}</strong>
                <span>Total Invested</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.totalCommittedReturn)}</strong>
                <span>Committed Return</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.totalReturnsReceived)}</strong>
                <span>Returns Received</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.pendingPayout)}</strong>
                <span>Pending Payout</span>
              </article>
              <article className="stats-item stats-item-identifier">
                <strong>{summary.identifier}</strong>
                <span>Login Identifier</span>
              </article>
            </div>

            <div className="section">
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
                {summary.orders.length === 0 ? <p>No orders yet.</p> : null}
              </article>

              <article className="tracking-panel portal-panel">
                <h3>Investor Accounts</h3>
                {summary.investors.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>
                      {item.investorCode} ({item.verificationStatus})<br />
                      <small>{formatDate(item.createdAt)}</small>
                    </span>
                    <strong>
                      {formatCurrency(item.totalInvested)}<br />
                      <small>Returns: {formatCurrency(item.totalReturnsReceived)}</small>
                    </strong>
                  </div>
                ))}
                {summary.investors.length === 0 ? <p>No investor profile linked yet.</p> : null}
              </article>

              <article className="tracking-panel portal-panel">
                <h3>Monthly Return History</h3>
                {summary.monthlyReturns.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>
                      {item.periodYear}-{String(item.periodMonth).padStart(2, "0")} | {item.investmentReference}<br />
                      <small>{item.status} | Updated {formatDate(item.updatedAt)}</small>
                    </span>
                    <strong>
                      {formatCurrency(item.finalAmount)}<br />
                      <small>Calc: {formatCurrency(item.calculatedAmount)}</small>
                    </strong>
                  </div>
                ))}
                {summary.monthlyReturns.length === 0 ? <p>No monthly return entries yet.</p> : null}
              </article>

              <article className="tracking-panel portal-panel">
                <h3>Payout & Receipts</h3>
                {summary.payouts.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>
                      {item.payoutReference} ({item.status})<br />
                      <small>{item.paidAt ? `Paid ${formatDate(item.paidAt)}` : formatDate(item.createdAt)}</small>
                    </span>
                    <strong>
                      {formatCurrency(item.totalAmount)}<br />
                      <small>{item.transactionReference ?? "Transaction pending"}</small>
                    </strong>
                    {item.receiptNumber ? (
                      <a
                        className="button button-secondary button-small"
                        href={`${import.meta.env.VITE_API_BASE_URL}/portal/receipts/${item.receiptNumber}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Receipt
                      </a>
                    ) : null}
                  </div>
                ))}
                {summary.payouts.length === 0 ? <p>No payouts yet.</p> : null}
              </article>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
