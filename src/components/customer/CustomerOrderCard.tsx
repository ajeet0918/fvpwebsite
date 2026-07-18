import type { CustomerOrder } from "../../types/domain";

type CustomerOrderCardProps = {
  order: CustomerOrder;
  retrying: boolean;
  onRetryPayment: (orderId: number) => void;
};

function formatCurrency(value: number | null, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function canRetryPayment(order: CustomerOrder) {
  return ["PENDING", "FAILED", "NOT_INITIATED"].includes(order.paymentStatus);
}

function getLatestActivity(order: CustomerOrder) {
  const latestHistory = order.statusHistory[order.statusHistory.length - 1];
  if (!latestHistory) {
    return `Created ${formatDate(order.createdAt)}`;
  }
  return `${formatStatus(latestHistory.status)} ${formatDate(latestHistory.changedAt)}`;
}

export function CustomerOrderCard({ order, retrying, onRetryPayment }: CustomerOrderCardProps) {
  return (
    <article className="portal-order-card">
      <div className="portal-order-card-header">
        <div>
          <span className="portal-order-label">Order number</span>
          <strong>{order.orderNumber}</strong>
          <small>Placed {formatDate(order.createdAt)}</small>
        </div>
        <div className="portal-order-badges">
          <span className={`portal-status-badge portal-status-${order.status.toLowerCase()}`}>
            {formatStatus(order.status)}
          </span>
          <span className={`portal-payment-badge portal-payment-${order.paymentStatus.toLowerCase()}`}>
            Payment {formatStatus(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="portal-order-summary">
        <div><span>Items</span><strong>{order.items.length}</strong></div>
        <div><span>Order total</span><strong>{formatCurrency(order.totalAmount, order.currency)}</strong></div>
        <div><span>Delivery location</span><strong>{order.city}, {order.state}</strong></div>
      </div>

      <div className="portal-order-items" aria-label="Order items">
        {order.items.slice(0, 3).map((item) => (
          <span key={item.id}>{item.productName} &times; {item.quantity}</span>
        ))}
        {order.items.length > 3 ? <span>+ {order.items.length - 3} more</span> : null}
      </div>

      <div className="portal-order-card-footer">
        <span>{getLatestActivity(order)}</span>
        {canRetryPayment(order) ? (
          <button
            type="button"
            className="button button-primary button-small"
            onClick={() => onRetryPayment(order.id)}
            disabled={retrying}
          >
            {retrying ? "Preparing payment..." : "Pay Now"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
