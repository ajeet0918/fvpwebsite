import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { fetchPortalSummaryApi, readErrorMessage } from "../lib/api";
import { clearPortalAccessToken, isPortalAuthenticated } from "../lib/portalAuth";
import type { PortalSummary } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PartnerDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalRows = useMemo(() => {
    if (!summary) return 0;
    return summary.orders.length + summary.investors.length + summary.farmers.length;
  }, [summary]);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        setSummary(await fetchPortalSummaryApi());
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load portal data."));
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, []);

  if (!isPortalAuthenticated()) {
    return <Navigate to="/partner/login" replace />;
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Partner Portal</span>
          <h2>Farmer and Investor Dashboard</h2>
          <p>Review registration status, investment returns, payouts, and linked order activity.</p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                clearPortalAccessToken();
                navigate("/partner/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {loading ? <p>Loading portal data...</p> : null}

        {!loading && summary ? (
          <>
            <div className="stats-band portal-stats-band">
              <article className="stats-item">
                <strong>{summary.orderCount}</strong>
                <span>Linked Orders</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.totalInvested)}</strong>
                <span>Total Invested</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.totalReturnsReceived)}</strong>
                <span>Returns Received</span>
              </article>
              <article className="stats-item">
                <strong>{formatCurrency(summary.pendingPayout)}</strong>
                <span>Pending Payout</span>
              </article>
            </div>

            <div className="portal-layout-grid">
              <article className="tracking-panel portal-panel">
                <h3>Investor Accounts</h3>
                {summary.investors.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>
                      {item.investorCode}<br />
                      <small>{item.status} | {item.verificationStatus}</small>
                    </span>
                    <strong>{formatCurrency(item.totalInvested)}</strong>
                  </div>
                ))}
                {summary.investors.length === 0 ? <p>No investor account linked yet.</p> : null}
              </article>

              <article className="tracking-panel portal-panel">
                <h3>Farmer Registrations</h3>
                {summary.farmers.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>
                      {item.referenceId ?? `FARMER-${item.id}`}<br />
                      <small>{item.status} | {item.verificationStatus}</small>
                    </span>
                    <strong>{item.mainCrops ?? "-"}</strong>
                  </div>
                ))}
                {summary.farmers.length === 0 ? <p>No farmer registration linked yet.</p> : null}
              </article>
            </div>

            <article className="tracking-panel portal-panel">
              <h3>Monthly Returns</h3>
              {summary.monthlyReturns.map((item) => (
                <div key={item.id} className="tracking-item-row">
                  <span>
                    {item.investmentReference}<br />
                    <small>{item.periodMonth}/{item.periodYear} | {item.status}</small>
                  </span>
                  <strong>{formatCurrency(item.finalAmount)}</strong>
                </div>
              ))}
              {summary.monthlyReturns.length === 0 ? <p>No monthly return records yet.</p> : null}
            </article>

            <article className="tracking-panel portal-panel">
              <h3>Payouts</h3>
              {summary.payouts.map((item) => (
                <div key={item.id} className="tracking-item-row">
                  <span>
                    {item.payoutReference}<br />
                    <small>{item.status} | {item.createdAt ? formatDate(item.createdAt) : "-"}</small>
                  </span>
                  <strong>{formatCurrency(item.totalAmount)}</strong>
                </div>
              ))}
              {summary.payouts.length === 0 ? <p>No payouts yet.</p> : null}
            </article>

            {totalRows === 0 ? (
              <p className="form-message">Your account is active, but no linked records are available yet.</p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
