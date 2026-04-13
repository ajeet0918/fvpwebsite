import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { readErrorMessage, trackOrderApi } from "../lib/api";
import type { Order } from "../types/domain";

function formatCurrency(value: number | null, currency = "INR") {
  if (value === null || Number.isNaN(value)) return "Pending";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not updated";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function formatStatusLabel(status: Order["status"]) {
  return status.split("_").join(" ");
}

export function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  async function handleTrackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trackingNumber.trim()) {
      setTrackingError("Enter your order number.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);
    try {
      setTrackedOrder(await trackOrderApi(trackingNumber.trim()));
    } catch (error) {
      setTrackedOrder(null);
      setTrackingError(readErrorMessage(error, "Unable to find that order."));
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <section className="section section-soft page-top">
      <div className="container two-column-layout">
        <div>
          <div className="section-heading section-heading-left">
            <span className="section-badge">Order Tracking</span>
            <h2>Track Any Order By Number</h2>
            <p>
              Legacy tracking is still available here. For best experience, use
              {" "}
              <Link to="/portal/login">My Account</Link>
              {" "}
              with OTP.
            </p>
          </div>
          <form className="track-form" onSubmit={handleTrackSubmit}>
            <input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
              placeholder="Enter order number, for example FVP-20260409-1234"
            />
            <button type="submit" className="button button-primary" disabled={trackingLoading}>
              {trackingLoading ? "Tracking..." : "Track Order"}
            </button>
          </form>
          {trackingError ? <p className="form-message form-message-error">{trackingError}</p> : null}
        </div>

        <div className="tracking-panel">
          {trackedOrder ? (
            <>
              <div className="tracking-summary">
                <div><span>Order</span><strong>{trackedOrder.orderNumber}</strong></div>
                <div><span>Status</span><strong>{formatStatusLabel(trackedOrder.status)}</strong></div>
                <div><span>Total</span><strong>{formatCurrency(trackedOrder.totalAmount, trackedOrder.currency)}</strong></div>
              </div>
              <div className="tracking-timeline">
                {trackedOrder.statusHistory.map((entry) => (
                  <div key={`${entry.status}-${entry.changedAt}`} className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <strong>{formatStatusLabel(entry.status)}</strong>
                      <p>{entry.note}</p>
                      <span>{formatDate(entry.changedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tracking-items">
                <h3>Items</h3>
                {trackedOrder.items.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <span>{item.productName} - {item.quantity} {item.unit}</span>
                    <strong>{formatCurrency(item.lineTotal, trackedOrder.currency)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <p>Tracked order details will appear here.</p>}
        </div>
      </div>
    </section>
  );
}
