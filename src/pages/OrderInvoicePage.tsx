import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { readErrorMessage, trackOrderApi } from "../lib/api";
import type { Order } from "../types/domain";

const eligibleStatuses: Order["status"][] = ["QUOTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function formatCurrency(value: number | null, currency = "INR") {
  if (value === null || Number.isNaN(value)) return "Pending";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function buildInvoiceNumber(order: Order) {
  if (order.quoteReference?.trim()) {
    return order.quoteReference.trim();
  }
  return `INV-${order.orderNumber}`;
}

export function OrderInvoicePage() {
  const params = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderNumber = params.orderNumber ?? "";

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber.trim()) {
        setError("Missing order number.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await trackOrderApi(orderNumber);
        setOrder(response);
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load invoice."));
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderNumber]);

  const canShowInvoice = useMemo(
    () => Boolean(order && eligibleStatuses.includes(order.status) && order.totalAmount !== null),
    [order]
  );

  if (loading) {
    return <section className="section page-top"><div className="container"><p>Loading invoice...</p></div></section>;
  }

  return (
    <section className="section page-top section-soft">
      <div className="container">
        {error ? <p className="form-message form-message-error">{error}</p> : null}

        {!order ? null : !canShowInvoice ? (
          <article className="order-form">
            <h2>Invoice Not Available Yet</h2>
            <p>
              Invoice is generated after pricing and order confirmation.
              Please check your account status first.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/portal/login">Go To My Account</Link>
            </div>
          </article>
        ) : (
          <article className="invoice-sheet">
            <header className="invoice-header">
              <div className="invoice-brand">
                <img src="/assets/logofvp.jpeg" alt="FVP Purepick" />
                <div>
                  <h1>FVP Purepick</h1>
                  <p>Agricultural Wholesale</p>
                </div>
              </div>
              <div className="invoice-meta">
                <strong>Invoice</strong>
                <span>{buildInvoiceNumber(order)}</span>
                <small>Order: {order.orderNumber}</small>
              </div>
            </header>

            <div className="invoice-grid">
              <div>
                <h3>Bill To</h3>
                <p>{order.fullName}</p>
                <p>{order.companyName}</p>
                <p>{order.email}</p>
                <p>{order.phone}</p>
              </div>
              <div>
                <h3>Delivery Address</h3>
                <p>{order.deliveryAddress}</p>
                <p>{order.city}, {order.state} - {order.postalCode}</p>
              </div>
              <div>
                <h3>Invoice Date</h3>
                <p>{formatDate(order.confirmedAt ?? order.quotedAt ?? order.createdAt)}</p>
                <h3>Status</h3>
                <p>{order.status.split("_").join(" ")}</p>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{formatCurrency(item.unitPrice, order.currency)}</td>
                    <td>{formatCurrency(item.lineTotal, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div><span>Subtotal</span><strong>{formatCurrency(order.subtotalAmount, order.currency)}</strong></div>
              <div><span>Discount</span><strong>- {formatCurrency(order.discountAmount ?? 0, order.currency)}</strong></div>
              <div><span>Shipping</span><strong>{formatCurrency(order.shippingAmount, order.currency)}</strong></div>
              <div>
                <span>
                  Tax
                  {order.effectiveTaxRate !== null ? ` (${order.effectiveTaxRate}% effective)` : ""}
                </span>
                <strong>{formatCurrency(order.taxAmount, order.currency)}</strong>
              </div>
              <div className="invoice-grand-total"><span>Total</span><strong>{formatCurrency(order.totalAmount, order.currency)}</strong></div>
            </div>

            <footer className="invoice-footer">
              <p>Thank you for choosing FVP Purepick.</p>
              <p>For support: contact@fvpurepick.com | +91-9650035272</p>
            </footer>

            <div className="hero-actions invoice-print-hidden">
              <button type="button" className="button button-primary" onClick={() => window.print()}>
                Download / Print Invoice
              </button>
              <Link className="button button-secondary" to="/portal">
                Back To Account
              </Link>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
