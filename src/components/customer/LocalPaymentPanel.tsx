import type { LocalPaymentOutcome } from "../../types/domain";

type LocalPaymentPanelProps = {
  orderNumber: string;
  busy?: boolean;
  onOutcome: (outcome: LocalPaymentOutcome) => void;
  onCancel?: () => void;
};

export function LocalPaymentPanel({
  orderNumber,
  busy = false,
  onOutcome,
  onCancel
}: LocalPaymentPanelProps) {
  return (
    <div className="local-payment-panel" aria-label="Local payment simulator">
      <div className="local-payment-panel-icon" aria-hidden="true">&#9889;</div>
      <span className="checkout-panel-kicker">Local test mode</span>
      <h3>Simulate payment for {orderNumber}</h3>
      <p>
        Cashfree is bypassed in this local profile. Use the controls below to test the real
        order status lifecycle.
      </p>
      <div className="local-payment-panel-actions">
        <button
          type="button"
          className="button button-primary"
          disabled={busy}
          onClick={() => onOutcome("SUCCESS")}
        >
          {busy ? "Updating payment..." : "Simulate success"}
        </button>
        <button
          type="button"
          className="button button-danger-outline"
          disabled={busy}
          onClick={() => onOutcome("FAILURE")}
        >
          Simulate failure
        </button>
        {onCancel ? (
          <button type="button" className="button button-secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      <small>Test only. This panel is available only when the backend local profile is active.</small>
    </div>
  );
}
