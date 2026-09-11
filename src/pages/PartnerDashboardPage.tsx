import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  downloadPortalReceiptApi,
  fetchPortalSummaryApi,
  readErrorMessage
} from "../lib/api";
import {
  clearPortalAccessToken,
  getPortalUsername,
  getPortalUserType,
  isPortalAuthenticated,
  isPortalPasswordResetRequired,
  type PortalUserType
} from "../lib/portalAuth";
import type { PortalSummary } from "../types/domain";

type PartnerView = "overview" | "returns" | "payouts" | "orders" | "account";
type MonthlyReturn = PortalSummary["monthlyReturns"][number];
type Payout = PortalSummary["payouts"][number];

const headings: Record<PartnerView, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Partner account",
    title: "Your partnership, clearly tracked.",
    description: "A current view of your FVP Purepick relationship and linked activity."
  },
  returns: {
    eyebrow: "Investment ledger",
    title: "Monthly returns",
    description: "Review calculated, approved, and paid return records."
  },
  payouts: {
    eyebrow: "Payment record",
    title: "Payouts",
    description: "Follow each released amount from approval through receipt."
  },
  orders: {
    eyebrow: "Commercial activity",
    title: "Linked orders",
    description: "Orders and quote references connected to your partner profile."
  },
  account: {
    eyebrow: "Profile status",
    title: "Partner account",
    description: "Your registration, verification, and account identity."
  }
};

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value ?? 0);
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
}

function formatPeriod(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

function humanizeStatus(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(value: string | null | undefined) {
  const status = value?.toUpperCase() ?? "";
  if (["ACTIVE", "APPROVED", "VERIFIED", "PAID", "DELIVERED", "COMPLETED"].includes(status)) {
    return "partner-status-success";
  }
  if (["FAILED", "REJECTED", "CANCELLED", "SUSPENDED", "CLOSED"].includes(status)) {
    return "partner-status-danger";
  }
  if (["SUBMITTED", "UNDER_REVIEW", "PROCESSING"].includes(status)) {
    return "partner-status-info";
  }
  return "partner-status-pending";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  return <span className={`partner-status ${statusTone(value)}`}>{humanizeStatus(value)}</span>;
}

function PortalIcon({ name }: { name: PartnerView | "logout" | "support" | "chevron" }) {
  const paths: Record<string, string> = {
    overview: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-13h6V4h-6v3Z",
    returns: "M4 19V8m5 11V5m5 14v-8m5 8V3",
    payouts: "M3 7h18v12H3V7Zm0 4h18M7 15h3",
    orders: "M5 4h14v16H5V4Zm4 4h6M9 12h6M9 16h4",
    account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    logout: "M10 4H5v16h5m4-4 4-4-4-4m4 4H9",
    support: "M4 12a8 8 0 1 1 16 0v5a2 2 0 0 1-2 2h-2v-6h4M4 13h4v6H6a2 2 0 0 1-2-2v-4Z",
    chevron: "m9 18 6-6-6-6"
  };
  return (
    <svg className="partner-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function maskIdentifier(identifier: string) {
  if (identifier.includes("@")) {
    const [name, domain] = identifier.split("@");
    return `${name.slice(0, 2)}•••@${domain}`;
  }
  if (/^\+?\d[\d\s-]+$/.test(identifier)) {
    const digits = identifier.replace(/\D/g, "");
    return `••••••${digits.slice(-4)}`;
  }
  return identifier;
}

function inferUserType(summary: PortalSummary | null): PortalUserType {
  const stored = getPortalUserType();
  if (stored) return stored;
  if (summary?.investors.length) return "INVESTOR";
  if (summary?.farmers.length) return "FARMER";
  return "COLLECTION_HUB";
}

export function PartnerDashboardPage() {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<PartnerView>("overview");
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSummary = await fetchPortalSummaryApi();
      setSummary(nextSummary);
      setSelectedReturnId((current) => current ?? nextSummary.monthlyReturns[0]?.id ?? null);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to load portal data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (selectedPayout && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [selectedPayout]);

  const userType = inferUserType(summary);
  const roleLabel = userType === "COLLECTION_HUB" ? "Collection hub" : humanizeStatus(userType);
  const username = getPortalUsername() || summary?.identifier || "FVP partner";
  const displayIdentifier = maskIdentifier(summary?.identifier || username);
  const initials = username
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FP";

  const navItems = useMemo<Array<{ id: PartnerView; label: string }>>(() => {
    const items: Array<{ id: PartnerView; label: string }> = [
      { id: "overview", label: "Overview" }
    ];
    if (userType === "INVESTOR") {
      items.push({ id: "returns", label: "Returns" }, { id: "payouts", label: "Payouts" });
    }
    items.push({ id: "orders", label: "Orders" }, { id: "account", label: "Account" });
    return items;
  }, [userType]);

  const selectedReturn = useMemo<MonthlyReturn | null>(() => {
    if (!summary?.monthlyReturns.length) return null;
    return summary.monthlyReturns.find((item) => item.id === selectedReturnId) ?? summary.monthlyReturns[0];
  }, [selectedReturnId, summary]);

  const linkedPayout = useMemo<Payout | null>(() => {
    if (!selectedReturn?.payoutReference || !summary) return null;
    return summary.payouts.find((item) => item.payoutReference === selectedReturn.payoutReference) ?? null;
  }, [selectedReturn, summary]);

  const reviewReturn = useMemo(() => summary?.monthlyReturns.find((item) =>
    !["PAID", "REJECTED"].includes(item.status.toUpperCase())
  ) ?? null, [summary]);

  function handleReturnKeyDown(event: KeyboardEvent<HTMLTableRowElement>, item: MonthlyReturn) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedReturnId(item.id);
    }
  }

  function changeView(view: PartnerView) {
    setActiveView(view);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogout() {
    clearPortalAccessToken();
    navigate("/partner/login", { replace: true });
  }

  async function handleReceiptDownload() {
    if (!selectedPayout?.receiptNumber) return;
    try {
      setDownloading(true);
      setDownloadMessage(null);
      const blob = await downloadPortalReceiptApi(selectedPayout.receiptNumber);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedPayout.receiptNumber}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadMessage("Receipt downloaded successfully.");
    } catch (errorValue) {
      setDownloadMessage(readErrorMessage(errorValue, "Unable to download this receipt."));
    } finally {
      setDownloading(false);
    }
  }

  if (!isPortalAuthenticated()) {
    return <Navigate to="/partner/login" replace />;
  }

  if (isPortalPasswordResetRequired()) {
    return <Navigate to="/partner/reset-password" replace />;
  }

  const heading = headings[activeView];
  const investor = summary?.investors[0] ?? null;
  const farmer = summary?.farmers[0] ?? null;
  const accountStatus = investor?.status ?? farmer?.status ?? "ACTIVE";
  const verificationStatus = investor?.verificationStatus ?? farmer?.verificationStatus ?? "PENDING";

  return (
    <div className="partner-portal-shell">
      <a className="partner-skip-link" href="#partner-main">Skip to portal content</a>

      <aside className="partner-sidebar">
        <button className="partner-brand" type="button" onClick={() => changeView("overview")}>
          <img src="/assets/logofvp.jpeg" alt="FVP Purepick logo" />
          <span><strong>FVP Purepick</strong><small>Partner portal</small></span>
        </button>

        <div className="partner-sidebar-nav-wrap">
          <p className="partner-sidebar-label">Your partnership</p>
          <nav className="partner-sidebar-nav" aria-label="Partner portal navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={activeView === item.id ? "page" : undefined}
                onClick={() => changeView(item.id)}
              >
                <PortalIcon name={item.id} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="partner-sidebar-footer">
          <p>Signed in as</p>
          <strong>{displayIdentifier}</strong>
          <span>{roleLabel} partner</span>
          <a className="partner-support-link" href="mailto:support@fvppurepick.com">
            <PortalIcon name="support" /> Support
          </a>
          <button type="button" className="partner-logout" onClick={handleLogout}>
            <PortalIcon name="logout" /> Log out
          </button>
        </div>
      </aside>

      <div className="partner-portal-main-wrap">
        <header className="partner-topbar">
          <div className="partner-breadcrumb">Partner portal <span>/</span> <strong>{heading.title}</strong></div>
          <div className="partner-account-menu-wrap">
            <button
              type="button"
              className="partner-account-button"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <span className="partner-avatar">{initials}</span>
              <span className="partner-account-button-copy">
                <strong>{roleLabel}</strong>
                <small>{humanizeStatus(verificationStatus)}</small>
              </span>
              <PortalIcon name="chevron" />
            </button>
            {accountMenuOpen ? (
              <div className="partner-account-popover">
                <button type="button" onClick={() => changeView("account")}>View account</button>
                <a href="mailto:support@fvppurepick.com">Contact support</a>
                <button type="button" onClick={handleLogout}>Log out</button>
              </div>
            ) : null}
          </div>
        </header>

        <main id="partner-main" className="partner-content" tabIndex={-1}>
          <header className="partner-page-heading">
            <div>
              <p>{heading.eyebrow}</p>
              <h1>{heading.title}</h1>
              <span>{heading.description}</span>
            </div>
            {investor ? (
              <div className="partner-code-card"><span>Investor code</span><strong>{investor.investorCode}</strong></div>
            ) : farmer ? (
              <div className="partner-code-card"><span>Farmer reference</span><strong>{farmer.referenceId ?? `FARMER-${farmer.id}`}</strong></div>
            ) : (
              <div className="partner-code-card"><span>Partner role</span><strong>COLLECTION HUB</strong></div>
            )}
          </header>

          {loading ? (
            <section className="partner-loading-state" aria-live="polite">
              <span className="partner-spinner" aria-hidden="true" />
              <div><strong>Loading your partner records</strong><p>Connecting to the secure portal…</p></div>
            </section>
          ) : null}

          {error && !loading ? (
            <section className="partner-error-state" role="alert">
              <div><strong>We could not refresh your records.</strong><p>{error}</p></div>
              <button type="button" className="partner-button partner-button-secondary" onClick={() => void loadSummary()}>Try again</button>
            </section>
          ) : null}

          {!loading && !error && summary ? (
            <>
              {activeView === "overview" ? (
                <OverviewView
                  summary={summary}
                  userType={userType}
                  selectedReturn={selectedReturn}
                  linkedPayout={linkedPayout}
                  reviewReturn={reviewReturn}
                  accountStatus={accountStatus}
                  verificationStatus={verificationStatus}
                  onSelectReturn={setSelectedReturnId}
                  onReturnKeyDown={handleReturnKeyDown}
                  onNavigate={changeView}
                  onOpenPayout={(payout) => {
                    setSelectedPayout(payout);
                    changeView("payouts");
                  }}
                  onOpenReceipt={setSelectedPayout}
                />
              ) : null}
              {activeView === "returns" ? (
                <ReturnsView
                  returns={summary.monthlyReturns}
                  selectedReturn={selectedReturn}
                  onSelectReturn={setSelectedReturnId}
                  onReturnKeyDown={handleReturnKeyDown}
                  onOpenPayout={() => changeView("payouts")}
                />
              ) : null}
              {activeView === "payouts" ? (
                <PayoutsView payouts={summary.payouts} onOpenReceipt={setSelectedPayout} />
              ) : null}
              {activeView === "orders" ? <OrdersView orders={summary.orders} /> : null}
              {activeView === "account" ? (
                <AccountView
                  summary={summary}
                  userType={userType}
                  accountStatus={accountStatus}
                  verificationStatus={verificationStatus}
                />
              ) : null}
            </>
          ) : null}
        </main>
      </div>

      <nav className="partner-mobile-nav" aria-label="Mobile partner portal navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={activeView === item.id ? "page" : undefined}
            onClick={() => changeView(item.id)}
          >
            <PortalIcon name={item.id} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <dialog
        ref={dialogRef}
        className="partner-receipt-dialog"
        aria-labelledby="partner-receipt-title"
        onClose={() => {
          setSelectedPayout(null);
          setDownloadMessage(null);
        }}
      >
        {selectedPayout ? (
          <div className="partner-receipt-dialog-inner">
            <header>
              <div><p>Payout record</p><h2 id="partner-receipt-title">Receipt preview</h2></div>
              <button type="button" aria-label="Close receipt preview" onClick={() => dialogRef.current?.close()}>×</button>
            </header>
            <div className="partner-receipt-paper">
              <div className="partner-receipt-brand">
                <div><strong>FVP Purepick</strong><span>Partner payout acknowledgement</span></div>
                <b>{selectedPayout.receiptNumber ? "RECEIPT" : "PAYOUT"}</b>
              </div>
              <dl>
                <div><dt>Receipt number</dt><dd>{selectedPayout.receiptNumber ?? "Issued after payment"}</dd></div>
                <div><dt>Payout reference</dt><dd>{selectedPayout.payoutReference}</dd></div>
                <div><dt>Amount</dt><dd>{formatCurrency(selectedPayout.totalAmount)}</dd></div>
                <div><dt>Status</dt><dd>{humanizeStatus(selectedPayout.status)}</dd></div>
                <div><dt>Payment channel</dt><dd>{selectedPayout.paymentChannel ?? "—"}</dd></div>
                <div><dt>Transaction reference</dt><dd>{selectedPayout.transactionReference ?? "Awaiting payment"}</dd></div>
                <div><dt>Created date</dt><dd>{formatDate(selectedPayout.createdAt)}</dd></div>
                <div><dt>Paid date</dt><dd>{formatDate(selectedPayout.paidAt)}</dd></div>
              </dl>
            </div>
            {downloadMessage ? <p className="partner-download-message" role="status">{downloadMessage}</p> : null}
            <footer>
              <button type="button" className="partner-button partner-button-secondary" onClick={() => dialogRef.current?.close()}>Close</button>
              <button
                type="button"
                className="partner-button partner-button-primary"
                disabled={!selectedPayout.receiptNumber || downloading}
                onClick={() => void handleReceiptDownload()}
              >
                {downloading ? "Downloading…" : selectedPayout.receiptNumber ? "Download receipt" : "Receipt not issued"}
              </button>
            </footer>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

type OverviewProps = {
  summary: PortalSummary;
  userType: PortalUserType;
  selectedReturn: MonthlyReturn | null;
  linkedPayout: Payout | null;
  reviewReturn: MonthlyReturn | null;
  accountStatus: string;
  verificationStatus: string;
  onSelectReturn: (id: number) => void;
  onReturnKeyDown: (event: KeyboardEvent<HTMLTableRowElement>, item: MonthlyReturn) => void;
  onNavigate: (view: PartnerView) => void;
  onOpenPayout: (payout: Payout) => void;
  onOpenReceipt: (payout: Payout) => void;
};

function OverviewView(props: OverviewProps) {
  const {
    summary,
    userType,
    selectedReturn,
    linkedPayout,
    reviewReturn,
    accountStatus,
    verificationStatus,
    onSelectReturn,
    onReturnKeyDown,
    onNavigate,
    onOpenPayout,
    onOpenReceipt
  } = props;

  if (userType !== "INVESTOR") {
    return (
      <div className="partner-overview-grid partner-role-overview">
        <section className="partner-card partner-role-card">
          <div className="partner-card-heading">
            <div><p>{userType === "FARMER" ? "Farmer registration" : "Collection hub profile"}</p><h2>Account overview</h2></div>
            <StatusBadge value={accountStatus} />
          </div>
          {userType === "FARMER" && summary.farmers.length ? (
            <div className="partner-role-records">
              {summary.farmers.map((farmer) => (
                <article key={farmer.id}>
                  <div><span>Reference</span><strong>{farmer.referenceId ?? `FARMER-${farmer.id}`}</strong></div>
                  <div><span>Farming type</span><strong>{farmer.farmingType ?? "Not provided"}</strong></div>
                  <div><span>Land area</span><strong>{farmer.landArea ?? "Not provided"}</strong></div>
                  <div><span>Main crops</span><strong>{farmer.mainCrops ?? "Not provided"}</strong></div>
                  {farmer.farmerActionNote ? <p>{farmer.farmerActionNote}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="partner-empty-state"><strong>Your account is active.</strong><p>Linked operational records will appear here when they are available.</p></div>
          )}
        </section>
        <AccountHealthCard accountStatus={accountStatus} verificationStatus={verificationStatus} userType={userType} />
        <LinkedOrdersCard orders={summary.orders} onViewAll={() => onNavigate("orders")} />
      </div>
    );
  }

  return (
    <>
      {reviewReturn ? (
        <section className="partner-review-band">
          <span className="partner-review-mark" aria-hidden="true">!</span>
          <div>
            <strong>Review {formatPeriod(reviewReturn.periodYear, reviewReturn.periodMonth)} return.</strong>
            <p>{formatCurrency(reviewReturn.finalAmount)} is recorded against {reviewReturn.investmentReference} with status {humanizeStatus(reviewReturn.status).toLowerCase()}.</p>
          </div>
          <button type="button" onClick={() => {
            onSelectReturn(reviewReturn.id);
            document.getElementById("partner-latest-return")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>Review return <span aria-hidden="true">→</span></button>
        </section>
      ) : null}

      <section className="partner-metrics" aria-label="Investment summary">
        <article><span>Total invested</span><strong>{formatCurrency(summary.totalInvested)}</strong><small>{summary.investors.length} linked investor account{summary.investors.length === 1 ? "" : "s"}</small></article>
        <article><span>Accrued / committed return</span><strong>{formatCurrency(summary.totalCommittedReturn)}</strong><small>Submitted, approved, and paid periods</small></article>
        <article><span>Returns received</span><strong>{formatCurrency(summary.totalReturnsReceived)}</strong><small>Paid to date</small></article>
        <article className="partner-metric-pending"><span>Pending payout</span><strong>{formatCurrency(summary.pendingPayout)}</strong><small>{summary.payouts.filter((item) => ["PENDING_APPROVAL", "APPROVED"].includes(item.status)).length} payout record(s)</small></article>
      </section>

      <div className="partner-overview-grid">
        <div className="partner-main-stack">
          <ReturnLedger
            returns={summary.monthlyReturns.slice(0, 5)}
            selectedReturn={selectedReturn}
            onSelectReturn={onSelectReturn}
            onReturnKeyDown={onReturnKeyDown}
            onViewAll={() => onNavigate("returns")}
            onOpenPayout={() => linkedPayout ? onOpenPayout(linkedPayout) : onNavigate("payouts")}
          />
          <LinkedOrdersCard orders={summary.orders.slice(0, 3)} onViewAll={() => onNavigate("orders")} />
        </div>
        <aside className="partner-side-stack">
          <PayoutCard payout={linkedPayout ?? summary.payouts[0] ?? null} onOpenReceipt={onOpenReceipt} onViewAll={() => onNavigate("payouts")} />
          <AccountHealthCard accountStatus={accountStatus} verificationStatus={verificationStatus} userType={userType} />
        </aside>
      </div>
    </>
  );
}

type ReturnLedgerProps = {
  returns: MonthlyReturn[];
  selectedReturn: MonthlyReturn | null;
  onSelectReturn: (id: number) => void;
  onReturnKeyDown: (event: KeyboardEvent<HTMLTableRowElement>, item: MonthlyReturn) => void;
  onViewAll?: () => void;
  onOpenPayout: () => void;
};

function ReturnLedger({ returns, selectedReturn, onSelectReturn, onReturnKeyDown, onViewAll, onOpenPayout }: ReturnLedgerProps) {
  return (
    <section id="partner-latest-return" className="partner-card partner-ledger-card">
      <div className="partner-card-heading">
        <div><p>Investment ledger</p><h2>{onViewAll ? "Latest monthly returns" : "Return history"}</h2><span>Select a period to review its calculation and linked payout.</span></div>
        {onViewAll ? <button type="button" className="partner-text-button" onClick={onViewAll}>View all returns</button> : null}
      </div>
      {returns.length ? (
        <>
          <div className="partner-table-scroll">
            <table className="partner-ledger-table">
              <thead><tr><th>Period & investment</th><th>Final amount</th><th>Status</th></tr></thead>
              <tbody>
                {returns.map((item) => (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    aria-selected={selectedReturn?.id === item.id}
                    onClick={() => onSelectReturn(item.id)}
                    onKeyDown={(event) => onReturnKeyDown(event, item)}
                  >
                    <td><strong>{formatPeriod(item.periodYear, item.periodMonth)}</strong><span>{item.investmentReference} · {item.returnRate}% rate</span></td>
                    <td className="partner-table-amount">{formatCurrency(item.finalAmount)}</td>
                    <td><StatusBadge value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedReturn ? (
            <div className="partner-return-detail">
              <dl>
                <div><dt>Base principal</dt><dd>{formatCurrency(selectedReturn.basePrincipal)}</dd></div>
                <div><dt>Monthly rate</dt><dd>{selectedReturn.returnRate}%</dd></div>
                <div><dt>Calculated amount</dt><dd>{formatCurrency(selectedReturn.calculatedAmount)}</dd></div>
                <div><dt>Final amount</dt><dd>{formatCurrency(selectedReturn.finalAmount)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(selectedReturn.updatedAt)}</dd></div>
                <div><dt>Receipt number</dt><dd>{selectedReturn.receiptNumber ?? "Pending issue"}</dd></div>
                <div className="partner-detail-wide"><dt>Override reason</dt><dd>{selectedReturn.overrideReason ?? "No override applied"}</dd></div>
              </dl>
              <div className="partner-linked-payout-row">
                <div><span>Linked payout reference</span><strong>{selectedReturn.payoutReference ?? "Not linked yet"}</strong></div>
                <button type="button" disabled={!selectedReturn.payoutReference} onClick={onOpenPayout}>Open payout detail <span aria-hidden="true">→</span></button>
              </div>
            </div>
          ) : null}
        </>
      ) : <div className="partner-empty-state"><strong>No monthly returns yet.</strong><p>Calculated returns will appear here after they are recorded.</p></div>}
    </section>
  );
}

function PayoutCard({ payout, onOpenReceipt, onViewAll }: { payout: Payout | null; onOpenReceipt: (payout: Payout) => void; onViewAll: () => void }) {
  return (
    <section className="partner-card">
      <div className="partner-card-heading">
        <div><p>Selected return</p><h2>Linked payout</h2><span>Approval, payment, and receipt trail.</span></div>
        {payout ? <StatusBadge value={payout.status} /> : null}
      </div>
      {payout ? (
        <div className="partner-payout-card-body">
          <strong className="partner-payout-amount">{formatCurrency(payout.totalAmount)}</strong>
          <dl>
            <div><dt>Reference</dt><dd>{payout.payoutReference}</dd></div>
            <div><dt>Payment channel</dt><dd>{payout.paymentChannel ?? "Not assigned"}</dd></div>
            <div><dt>Transaction reference</dt><dd>{payout.transactionReference ?? "Awaiting payment"}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(payout.createdAt)}</dd></div>
            <div><dt>Receipt</dt><dd>{payout.receiptNumber ?? "Issued after payment"}</dd></div>
          </dl>
          <button type="button" className="partner-button partner-button-primary partner-button-full" onClick={() => onOpenReceipt(payout)}>
            {payout.receiptNumber ? "Preview receipt" : "View payout record"}
          </button>
          <button type="button" className="partner-text-button partner-payout-all" onClick={onViewAll}>View all payouts</button>
        </div>
      ) : <div className="partner-empty-state"><strong>No linked payout.</strong><p>A payout record will appear when a return is approved.</p></div>}
    </section>
  );
}

function AccountHealthCard({ accountStatus, verificationStatus, userType }: { accountStatus: string; verificationStatus: string; userType: PortalUserType }) {
  const healthy = accountStatus === "ACTIVE" && verificationStatus === "VERIFIED";
  return (
    <section className="partner-card">
      <div className="partner-card-heading"><div><p>Profile status</p><h2>Account health</h2><span>Registration and verification state.</span></div></div>
      <div className="partner-health-body">
        <div className={healthy ? "partner-health-message" : "partner-health-message partner-health-message-pending"}>
          <b aria-hidden="true">{healthy ? "✓" : "i"}</b>
          <div><strong>{healthy ? "Verified and active" : "Account status available"}</strong><p>{healthy ? "Your account is in good standing for linked portal records." : "Review the statuses below or contact your FVP relationship manager."}</p></div>
        </div>
        <dl>
          <div><dt>Account status</dt><dd><StatusBadge value={accountStatus} /></dd></div>
          <div><dt>Verification</dt><dd><StatusBadge value={verificationStatus} /></dd></div>
          <div><dt>Partner role</dt><dd>{userType === "COLLECTION_HUB" ? "Collection hub" : humanizeStatus(userType)}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function LinkedOrdersCard({ orders, onViewAll }: { orders: PortalSummary["orders"]; onViewAll: () => void }) {
  return (
    <section className="partner-card">
      <div className="partner-card-heading">
        <div><p>Commercial activity</p><h2>Linked orders</h2><span>Orders connected to your partner profile.</span></div>
        <button type="button" className="partner-text-button" onClick={onViewAll}>View all orders</button>
      </div>
      {orders.length ? (
        <div className="partner-order-list">
          {orders.map((order) => (
            <article key={order.id}>
              <div><strong>{order.orderNumber}</strong><span>{order.quoteReference ? `Quote ${order.quoteReference} · ` : ""}{formatDate(order.createdAt)}</span></div>
              <div><b>{formatCurrency(order.totalAmount, order.currency)}</b><StatusBadge value={order.status} /></div>
            </article>
          ))}
        </div>
      ) : <div className="partner-empty-state"><strong>No linked orders.</strong><p>Orders associated with this account will appear here.</p></div>}
    </section>
  );
}

function ReturnsView(props: Omit<ReturnLedgerProps, "returns"> & { returns: MonthlyReturn[] }) {
  return <ReturnLedger {...props} />;
}

function PayoutsView({ payouts, onOpenReceipt }: { payouts: Payout[]; onOpenReceipt: (payout: Payout) => void }) {
  if (!payouts.length) {
    return <section className="partner-card"><div className="partner-empty-state"><strong>No payouts yet.</strong><p>Approved return payouts will appear here with their payment and receipt trail.</p></div></section>;
  }
  return (
    <section className="partner-card">
      <div className="partner-card-heading"><div><p>Payment ledger</p><h2>Payout history</h2><span>Every recorded payout tied to your investor account.</span></div></div>
      <div className="partner-payout-list">
        {payouts.map((payout) => (
          <article key={payout.id}>
            <div className="partner-payout-list-main"><span>{payout.payoutReference}</span><strong>{formatCurrency(payout.totalAmount)}</strong><small>Created {formatDate(payout.createdAt)}</small></div>
            <dl><div><dt>Status</dt><dd><StatusBadge value={payout.status} /></dd></div><div><dt>Channel</dt><dd>{payout.paymentChannel ?? "Not assigned"}</dd></div><div><dt>Transaction</dt><dd>{payout.transactionReference ?? "Awaiting payment"}</dd></div><div><dt>Paid</dt><dd>{formatDate(payout.paidAt)}</dd></div></dl>
            <button type="button" className="partner-button partner-button-secondary" onClick={() => onOpenReceipt(payout)}>{payout.receiptNumber ? "View receipt" : "View details"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrdersView({ orders }: { orders: PortalSummary["orders"] }) {
  return (
    <section className="partner-card">
      <div className="partner-card-heading"><div><p>Linked records</p><h2>Order history</h2><span>Read-only commercial activity connected to this profile.</span></div><strong className="partner-count-label">{orders.length} total</strong></div>
      {orders.length ? (
        <div className="partner-orders-table-wrap"><table className="partner-orders-table"><thead><tr><th>Order</th><th>Quote reference</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{order.quoteReference ?? "—"}</td><td>{formatDate(order.createdAt)}</td><td><StatusBadge value={order.status} /></td><td>{formatCurrency(order.totalAmount, order.currency)}</td></tr>)}</tbody></table></div>
      ) : <div className="partner-empty-state"><strong>No linked orders.</strong><p>Orders associated with your registered email or phone will appear here.</p></div>}
    </section>
  );
}

function AccountView({ summary, userType, accountStatus, verificationStatus }: { summary: PortalSummary; userType: PortalUserType; accountStatus: string; verificationStatus: string }) {
  const investor = summary.investors[0];
  const farmer = summary.farmers[0];
  return (
    <div className="partner-account-grid">
      <AccountHealthCard accountStatus={accountStatus} verificationStatus={verificationStatus} userType={userType} />
      <section className="partner-card">
        <div className="partner-card-heading"><div><p>Account identity</p><h2>Linked profile</h2><span>Information associated with this secure portal login.</span></div></div>
        <dl className="partner-profile-list">
          <div><dt>Signed-in identifier</dt><dd>{maskIdentifier(summary.identifier)}</dd></div>
          {investor ? <><div><dt>Investor code</dt><dd>{investor.investorCode}</dd></div><div><dt>Member since</dt><dd>{formatDate(investor.createdAt)}</dd></div></> : null}
          {farmer ? <><div><dt>Farmer reference</dt><dd>{farmer.referenceId ?? `FARMER-${farmer.id}`}</dd></div><div><dt>Main crops</dt><dd>{farmer.mainCrops ?? "Not provided"}</dd></div></> : null}
          <div><dt>Access level</dt><dd>Read-only partner records</dd></div>
        </dl>
        <div className="partner-role-note"><strong>Role-aware experience</strong><p>Farmer and collection-hub accounts use the same secure shell, with role-specific linked records replacing investor returns and payouts. Account data is managed by FVP operations.</p></div>
      </section>
    </div>
  );
}
