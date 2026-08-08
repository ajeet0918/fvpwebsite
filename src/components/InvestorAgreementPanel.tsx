import { useEffect, useState } from "react";
import {
  downloadPortalInvestorAgreementApi,
  fetchPortalInvestorOnboardingApi,
  readErrorMessage
} from "../lib/api";
import type { PortalInvestorOnboarding } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value ?? 0);
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Pending";
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export function InvestorAgreementPanel() {
  const [details, setDetails] = useState<PortalInvestorOnboarding | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setDetails(await fetchPortalInvestorOnboardingApi());
      } catch (requestError) {
        setError(readErrorMessage(requestError, "Unable to load investment agreement details."));
      }
    }
    void load();
  }, []);

  async function downloadAgreement(agreementId: number, agreementNumber: string) {
    try {
      setDownloadingId(agreementId);
      setError(null);
      const blob = await downloadPortalInvestorAgreementApi(agreementId);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${agreementNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (requestError) {
      setError(readErrorMessage(requestError, "Unable to download the investment agreement."));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <article className="tracking-panel portal-panel">
      <h3>Investment and Agreement</h3>
      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {!details && !error ? <p>Loading investment details...</p> : null}
      {details ? (
        <>
          <div className="tracking-summary investor-onboarding-summary">
            <div><span>Investor</span><strong>{details.investorCode}</strong></div>
            <div><span>Investment</span><strong>{details.investmentReference}</strong></div>
            <div><span>Principal</span><strong>{formatCurrency(details.principalAmount)}</strong></div>
            <div><span>Monthly return rate</span><strong>{details.monthlyReturnRate}%</strong></div>
            <div><span>Payment</span><strong>{formatStatus(details.paymentStatus)}</strong></div>
            <div><span>Paid at</span><strong>{formatDate(details.paidAt)}</strong></div>
          </div>
          <div>
            {details.agreements.map((agreement) => (
              <div key={agreement.id} className="tracking-item-row">
                <span>
                  {agreement.agreementNumber}<br />
                  <small>{formatStatus(agreement.status)} · {formatDate(agreement.generatedAt)}</small>
                </span>
                <strong>{formatStatus(agreement.status)}</strong>
                {agreement.downloadUrl ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={downloadingId === agreement.id}
                    onClick={() => void downloadAgreement(agreement.id, agreement.agreementNumber)}
                  >
                    {downloadingId === agreement.id ? "Downloading..." : "Download PDF"}
                  </button>
                ) : null}
              </div>
            ))}
            {details.agreements.length === 0 ? <p>No agreement is available yet.</p> : null}
          </div>
        </>
      ) : null}
    </article>
  );
}
