import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  createOrderPaymentSessionApi,
  createCustomerAddressApi,
  deleteCustomerAddressApi,
  fetchCustomerAddressesApi,
  fetchCustomerOrdersApi,
  fetchCustomerProfileApi,
  requestOrderCancellationApi,
  readErrorMessage,
  updateCustomerPaymentPreferenceApi,
  updateCustomerProfileApi
} from "../lib/api";
import { CustomerAddressBook, type CustomerAddressDraft } from "../components/customer/CustomerAddressBook";
import { CustomerOrderCard } from "../components/customer/CustomerOrderCard";
import {
  CustomerProfileSettings,
  type CustomerPaymentDraft,
  type CustomerProfileDraft
} from "../components/customer/CustomerProfileSettings";
import { openCashfreeCheckout } from "../lib/cashfree";
import { clearCustomerAccessToken, isCustomerAuthenticated } from "../lib/customerAuth";
import type { CustomerAddress, CustomerOrder, CustomerProfile } from "../types/domain";

type PortalView = "overview" | "orders" | "addresses" | "profile";
type OrderFilter = "all" | "due" | "transit" | "complete";

const PORTAL_NAV_ITEMS: Array<{ view: PortalView; label: string; path: string }> = [
  { view: "overview", label: "Overview", path: "/portal" },
  { view: "orders", label: "Orders", path: "/portal/orders" },
  { view: "addresses", label: "Addresses", path: "/portal/addresses" },
  { view: "profile", label: "Profile", path: "/portal/profile" }
];

function CustomerPortalIcon({ name }: { name: PortalView | "shop" | "logout" | "menu" | "chevron" | "wallet" | "check" | "help" }) {
  const paths: Record<string, string> = {
    overview: "M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4v-9.5Z",
    orders: "M5 7h14v13H5V7Zm3-3h8l3 3H5l3-3Zm1 8h6m-6 4h4",
    addresses: "M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    shop: "M5 9h14l-1 11H6L5 9Zm3 0a4 4 0 0 1 8 0",
    logout: "M10 4H5v16h5m4-4 4-4-4-4m4 4H9",
    menu: "M4 7h16M4 12h16M4 17h16",
    chevron: "m9 10 3 3 3-3",
    wallet: "M4 6h14a2 2 0 0 1 2 2v10H4V6Zm0 3h16m-5 4h5",
    check: "m5 12 4 4L19 6",
    help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-3-13a3 3 0 1 1 4.4 2.65C12.5 12.15 12 12.7 12 14m0 4h.01"
  };
  return <svg className="customer-portal-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "there";
}

function getPortalView(pathname: string): PortalView {
  const segment = pathname.split("/").filter(Boolean)[1];
  if (segment === "orders" || segment === "addresses" || segment === "profile") {
    return segment;
  }
  return "overview";
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CU";
}

function formatCurrency(value: number | null, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value ?? 0);
}

function isPaymentActionable(order: CustomerOrder) {
  return ["PENDING", "FAILED", "NOT_INITIATED", "DUE"].includes(order.paymentStatus)
    && (order.paymentMethod === "ONLINE"
      || ((order.paymentMethod === "CASH_ON_DELIVERY" || order.paymentMethod === "PAY_AFTER_DELIVERY_ONLINE")
        && order.status === "DELIVERED"));
}

export function PortalDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = getPortalView(location.pathname);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "PAID").length,
    [orders]
  );
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );
  const paidTotal = useMemo(
    () => orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
    [orders]
  );
  const paymentDueOrder = useMemo(
    () => orders.find(isPaymentActionable) ?? null,
    [orders]
  );

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        setError(null);
        const [profileResponse, ordersResponse, addressesResponse] = await Promise.all([
          fetchCustomerProfileApi(),
          fetchCustomerOrdersApi(),
          fetchCustomerAddressesApi()
        ]);
        setProfile(profileResponse);
        setOrders(ordersResponse);
        setAddresses(addressesResponse);
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load account data."));
      } finally {
        setLoading(false);
      }
    }

    void loadAccount();
  }, []);

  useEffect(() => {
    setError(null);
    setNotice(null);
    setAccountMenuOpen(false);
    setMobileNavOpen(false);
  }, [activeView]);

  if (!isCustomerAuthenticated()) {
    return <Navigate to={`/portal/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  async function handleProfileSave(draft: CustomerProfileDraft) {
    clearMessages();
    setSavingProfile(true);
    try {
      setProfile(await updateCustomerProfileApi(draft));
      setNotice("Profile details updated.");
      return true;
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to update profile."));
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePreferenceSave(draft: CustomerPaymentDraft) {
    clearMessages();
    setSavingPreference(true);
    try {
      setProfile(await updateCustomerPaymentPreferenceApi(draft));
      setNotice("Payment preference updated.");
      return true;
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to update payment preference."));
      return false;
    } finally {
      setSavingPreference(false);
    }
  }

  async function handleAddressCreate(draft: CustomerAddressDraft) {
    clearMessages();
    setSavingAddress(true);
    try {
      await createCustomerAddressApi(draft);
      setAddresses(await fetchCustomerAddressesApi());
      setNotice("Delivery address added.");
      return true;
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to save address."));
      return false;
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleAddressDelete(addressId: number) {
    clearMessages();
    try {
      await deleteCustomerAddressApi(addressId);
      setAddresses((current) => current.filter((address) => address.id !== addressId));
      setNotice("Saved address deleted.");
      return true;
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to delete address."));
      return false;
    }
  }

  async function handleRetryPayment(orderId: number) {
    clearMessages();
    setRetryingOrderId(orderId);
    try {
      const session = await createOrderPaymentSessionApi(orderId, {
        checkoutSuccessUrl: `${window.location.origin}/portal/orders`,
        checkoutFailureUrl: `${window.location.origin}/portal/orders`
      });
      if (session.paymentSessionId) {
        await openCashfreeCheckout(session.paymentSessionId);
        setOrders(await fetchCustomerOrdersApi());
        setNotice("Payment attempt completed. The latest order status is shown below.");
        return;
      }
      if (session.paymentLink) {
        window.location.href = session.paymentLink;
        return;
      }
      const latestOrders = await fetchCustomerOrdersApi();
      setOrders(latestOrders);
      const updatedOrder = latestOrders.find((order) => order.id === orderId);
      if (updatedOrder?.paymentStatus === "PAID") {
        setNotice(session.message || "Payment is confirmed.");
        return;
      }
      setError(session.message || "Payment session is not available right now.");
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to re-initiate payment."));
    } finally {
      setRetryingOrderId(null);
    }
  }

  async function handleRequestCancellation(orderId: number) {
    const reason = window.prompt("Tell us why you want to cancel this order:");
    if (!reason || reason.trim().length < 5) {
      return;
    }
    clearMessages();
    setCancellingOrderId(orderId);
    try {
      const updatedOrder = await requestOrderCancellationApi(orderId, reason.trim());
      setOrders((current) => current.map((order) => order.id === updatedOrder.id ? updatedOrder : order));
      setNotice("Cancellation request submitted. Our team will review it before procurement or dispatch.");
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to request cancellation."));
    } finally {
      setCancellingOrderId(null);
    }
  }

  function handleLogout() {
    clearCustomerAccessToken();
    navigate("/portal/login", { replace: true });
  }

  return (
    <div className="customer-portal-shell">
      <a className="customer-portal-skip-link" href="#customer-portal-main">Skip to account content</a>
      <header className="customer-portal-topbar">
        <Link className="customer-portal-brand" to="/portal" aria-label="FVP Purepick customer account overview">
          <img src="/assets/logofvp.jpeg" alt="FVP Purepick logo" />
          <span><strong>FVP Purepick</strong><small>Wholesale buyer portal</small></span>
        </Link>
        <div className="customer-portal-topbar-actions">
          <button
            className="customer-portal-menu-button"
            type="button"
            aria-label={mobileNavOpen ? "Close account navigation" : "Open account navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          ><CustomerPortalIcon name="menu" /></button>
          <Link className="customer-portal-button customer-portal-button-secondary customer-portal-shop-button" to="/shop">
            <CustomerPortalIcon name="shop" /><span>Continue shopping</span>
          </Link>
          {profile ? (
            <div className="customer-portal-account-wrap">
              <button
                className="customer-portal-account-button"
                type="button"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="customer-portal-avatar">{getInitials(profile.fullName)}</span>
                <span><strong>{profile.fullName}</strong><small>{profile.companyName || "Customer account"}</small></span>
                <CustomerPortalIcon name="chevron" />
              </button>
              {accountMenuOpen ? (
                <div className="customer-portal-account-popover">
                  <Link to="/portal/profile">Profile & preferences</Link>
                  <button type="button" onClick={handleLogout}>Log out</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="customer-portal-app">
        <aside className={mobileNavOpen ? "customer-portal-sidebar is-open" : "customer-portal-sidebar"} aria-label="Customer account navigation">
          <p className="customer-portal-sidebar-label">My account</p>
          <nav className="customer-portal-sidebar-nav">
            {PORTAL_NAV_ITEMS.map((item) => (
              <Link
                key={item.view}
                className={activeView === item.view ? "is-active" : undefined}
                to={item.path}
                aria-current={activeView === item.view ? "page" : undefined}
              >
                <CustomerPortalIcon name={item.view} />
                <span>{item.label}</span>
                {item.view === "orders" ? <small>{orders.length}</small> : null}
                {item.view === "addresses" ? <small>{addresses.length}</small> : null}
              </Link>
            ))}
          </nav>
          <div className="customer-portal-sidebar-bottom">
            <p>Need help with an order?<br />Mon–Sat, 9:00 AM–6:00 PM</p>
            <a href="mailto:contact@fvpurepick.com"><CustomerPortalIcon name="help" /> Contact support</a>
            <button type="button" onClick={handleLogout}><CustomerPortalIcon name="logout" /> Log out</button>
          </div>
        </aside>

        <main id="customer-portal-main" className="customer-portal-main" tabIndex={-1}>
          <div className="customer-portal-content">
            {loading ? (
              <section className="customer-portal-loading" aria-live="polite">
                <span aria-hidden="true" />
                <div><strong>Loading your buyer account</strong><p>Fetching orders, addresses, and profile details…</p></div>
              </section>
            ) : null}

            {error ? <p className="customer-portal-message customer-portal-message-error" role="alert">{error}</p> : null}
            {notice ? <p className="customer-portal-message customer-portal-message-success" role="status">{notice}</p> : null}

            {!loading && profile ? (
              <>
                {activeView === "overview" ? (
                  <OverviewView
                    profile={profile}
                    orders={orders}
                    paidOrders={paidOrders}
                    paidTotal={paidTotal}
                    paymentDueOrder={paymentDueOrder}
                    addresses={addresses}
                    defaultAddress={defaultAddress}
                    retryingOrderId={retryingOrderId}
                    onRetryPayment={handleRetryPayment}
                    onRequestCancellation={handleRequestCancellation}
                  />
                ) : null}
                {activeView === "orders" ? (
                  <OrdersView orders={orders} retryingOrderId={retryingOrderId} onRetryPayment={handleRetryPayment} onRequestCancellation={handleRequestCancellation} />
                ) : null}
                {activeView === "addresses" ? (
                  <CustomerAddressBook addresses={addresses} saving={savingAddress} onCreate={handleAddressCreate} onDelete={handleAddressDelete} />
                ) : null}
                {activeView === "profile" ? (
                  <CustomerProfileSettings profile={profile} savingProfile={savingProfile} savingPayment={savingPreference} onSaveProfile={handleProfileSave} onSavePayment={handlePreferenceSave} />
                ) : null}
              </>
            ) : null}

            <footer className="customer-portal-footer">
              <span>© {new Date().getFullYear()} FVP Purepick. All rights reserved.</span>
              <nav aria-label="Legal and support"><Link to="/policies">Terms & privacy</Link><Link to="/policies">Delivery policy</Link><a href="mailto:contact@fvpurepick.com">Support</a></nav>
            </footer>
          </div>
        </main>
      </div>

      <nav className="customer-portal-mobile-nav" aria-label="Mobile customer account navigation">
        {PORTAL_NAV_ITEMS.map((item) => (
          <Link key={item.view} className={activeView === item.view ? "is-active" : undefined} to={item.path} aria-current={activeView === item.view ? "page" : undefined}>
            <CustomerPortalIcon name={item.view} /><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button className={mobileNavOpen ? "customer-portal-scrim is-open" : "customer-portal-scrim"} type="button" aria-label="Close account navigation" onClick={() => setMobileNavOpen(false)} />
    </div>
  );
}

type OverviewViewProps = {
  profile: CustomerProfile;
  orders: CustomerOrder[];
  paidOrders: number;
  paidTotal: number;
  paymentDueOrder: CustomerOrder | null;
  addresses: CustomerAddress[];
  defaultAddress: CustomerAddress | null;
  retryingOrderId: number | null;
  onRetryPayment: (orderId: number) => void;
  onRequestCancellation: (orderId: number) => void;
};

function OverviewView(props: OverviewViewProps) {
  const { profile, orders, paidOrders, paidTotal, paymentDueOrder, addresses, defaultAddress, retryingOrderId, onRetryPayment, onRequestCancellation } = props;
  return (
    <section className="portal-view-section" aria-labelledby="overview-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Account overview</span>
          <h1 id="overview-heading">Welcome back, {firstName(profile.fullName)}</h1>
          <p>Here’s a clear view of your recent procurement activity and delivery details.</p>
        </div>
      </div>

      {paymentDueOrder ? (
        <section className="customer-portal-attention" aria-labelledby="customer-payment-needed">
          <span><CustomerPortalIcon name="wallet" /></span>
          <div><strong id="customer-payment-needed">Payment needed for order {paymentDueOrder.orderNumber}</strong><p>{formatCurrency(paymentDueOrder.totalAmount, paymentDueOrder.currency)} is ready to settle through secure checkout.</p></div>
          <button className="customer-portal-button customer-portal-button-amber" type="button" disabled={retryingOrderId === paymentDueOrder.id} onClick={() => onRetryPayment(paymentDueOrder.id)}>
            {retryingOrderId === paymentDueOrder.id ? "Preparing…" : `Settle ${formatCurrency(paymentDueOrder.totalAmount, paymentDueOrder.currency)}`}
          </button>
        </section>
      ) : null}

      <div className="portal-summary-grid">
        <Link to="/portal/orders"><span>Total orders</span><i><CustomerPortalIcon name="orders" /></i><strong>{orders.length}</strong><small>{orders.length ? "View your procurement history" : "Your first order will appear here"}</small></Link>
        <Link to="/portal/orders"><span>Paid orders</span><i><CustomerPortalIcon name="check" /></i><strong>{paidOrders}</strong><small>{formatCurrency(paidTotal)} paid in total</small></Link>
        <Link to="/portal/addresses"><span>Saved addresses</span><i><CustomerPortalIcon name="addresses" /></i><strong>{addresses.length}</strong><small>{defaultAddress ? "Default delivery point is set" : "Add a default delivery point"}</small></Link>
      </div>

      <div className="portal-overview-grid">
        <section className="portal-content-panel" aria-labelledby="recent-orders-heading">
          <div className="portal-panel-header">
            <div>
              <span className="portal-panel-kicker">Order activity</span>
              <h2 id="recent-orders-heading">Recent orders</h2>
            </div>
            <Link to="/portal/orders">View all</Link>
          </div>
          {orders.slice(0, 3).map((order) => (
            <CustomerOrderCard key={order.id} order={order} retrying={retryingOrderId === order.id} onRetryPayment={onRetryPayment} onRequestCancellation={onRequestCancellation} />
          ))}
          {orders.length === 0 ? <OrdersEmptyState /> : null}
        </section>

        <section className="portal-content-panel" aria-labelledby="default-address-heading">
          <div className="portal-panel-header">
            <div>
              <span className="portal-panel-kicker">Delivery</span>
              <h2 id="default-address-heading">Default address</h2>
            </div>
            <Link to="/portal/addresses">Manage</Link>
          </div>
          {defaultAddress ? (
            <div className="portal-default-address">
              <strong>{defaultAddress.label}</strong>
              <p>{defaultAddress.recipientName} &middot; {defaultAddress.phone}</p>
              <address>{defaultAddress.line1}{defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}<br />{defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}</address>
            </div>
          ) : (
            <div className="portal-empty-state">
              <strong>No delivery address</strong>
              <p>Add an address before placing your next order.</p>
              <Link className="button button-primary button-small" to="/portal/addresses">Add Address</Link>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

type OrdersViewProps = {
  orders: CustomerOrder[];
  retryingOrderId: number | null;
  onRetryPayment: (orderId: number) => void;
  onRequestCancellation: (orderId: number) => void;
};

function OrdersView({ orders, retryingOrderId, onRetryPayment, onRequestCancellation }: OrdersViewProps) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const filters: Array<{ id: OrderFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "due", label: "Payment due" },
    { id: "transit", label: "In transit" },
    { id: "complete", label: "Completed" }
  ];
  const matchesFilter = (order: CustomerOrder, value: OrderFilter) => {
    if (value === "due") return ["PENDING", "FAILED", "NOT_INITIATED", "DUE"].includes(order.paymentStatus);
    if (value === "transit") return ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status);
    if (value === "complete") return ["DELIVERED", "COMPLETED"].includes(order.status);
    return true;
  };
  const filteredOrders = orders.filter((order) => matchesFilter(order, filter));
  return (
    <section className="portal-view-section" aria-labelledby="orders-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Order history</span>
          <h1 id="orders-heading">Your orders</h1>
          <p>{orders.length} order{orders.length === 1 ? "" : "s"} across deliveries, payments, and cancellations.</p>
        </div>
        <Link className="button button-primary button-small" to="/shop">Shop Products</Link>
      </div>
      <div className="customer-portal-filters" role="toolbar" aria-label="Filter orders">
        {filters.map((item) => {
          const count = orders.filter((order) => matchesFilter(order, item.id)).length;
          return <button key={item.id} type="button" className={filter === item.id ? "is-active" : undefined} onClick={() => setFilter(item.id)}>{item.label} · {count}</button>;
        })}
      </div>
      <div className="portal-orders-list">
        {filteredOrders.map((order) => (
          <CustomerOrderCard key={order.id} order={order} retrying={retryingOrderId === order.id} onRetryPayment={onRetryPayment} onRequestCancellation={onRequestCancellation} />
        ))}
      </div>
      {orders.length === 0 ? <OrdersEmptyState /> : null}
      {orders.length > 0 && filteredOrders.length === 0 ? <div className="portal-empty-state"><strong>No matching orders</strong><p>Try another status filter to see your order history.</p><button className="customer-portal-button customer-portal-button-secondary" type="button" onClick={() => setFilter("all")}>Show all orders</button></div> : null}
    </section>
  );
}

function OrdersEmptyState() {
  return (
    <div className="portal-empty-state">
      <strong>No orders yet</strong>
      <p>Browse the catalog to start your first wholesale order.</p>
      <Link className="button button-primary button-small" to="/shop">Browse Catalog</Link>
    </div>
  );
}
