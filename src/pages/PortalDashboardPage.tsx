import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  createOrderPaymentSessionApi,
  createCustomerAddressApi,
  deleteCustomerAddressApi,
  fetchCustomerAddressesApi,
  fetchCustomerOrdersApi,
  fetchCustomerProfileApi,
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

const PORTAL_NAV_ITEMS: Array<{ view: PortalView; label: string; path: string }> = [
  { view: "overview", label: "Overview", path: "/portal" },
  { view: "orders", label: "Orders", path: "/portal/orders" },
  { view: "addresses", label: "Addresses", path: "/portal/addresses" },
  { view: "profile", label: "Profile", path: "/portal/profile" }
];

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

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "PAID").length,
    [orders]
  );
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    [addresses]
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
      if (session.paymentLink) {
        window.location.href = session.paymentLink;
        return;
      }
      if (session.paymentSessionId) {
        await openCashfreeCheckout(session.paymentSessionId);
        return;
      }
      setError(session.message || "Payment session is not available right now.");
      setOrders(await fetchCustomerOrdersApi());
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to re-initiate payment."));
    } finally {
      setRetryingOrderId(null);
    }
  }

  function handleLogout() {
    clearCustomerAccessToken();
    navigate("/portal/login", { replace: true });
  }

  return (
    <section className="section page-top portal-account-page">
      <div className="container">
        <div className="portal-page-heading">
          <span className="section-badge">Customer account</span>
          <h1>My account</h1>
          <p>Review orders, delivery details, and buyer information.</p>
        </div>

        {loading ? <div className="portal-loading-state">Loading your account...</div> : null}

        {!loading && profile ? (
          <div className="portal-account-shell">
            <aside className="portal-account-sidebar" aria-label="Customer account navigation">
              <div className="portal-account-identity">
                <span className="portal-account-avatar" aria-hidden="true">{getInitials(profile.fullName)}</span>
                <div>
                  <strong>{profile.fullName}</strong>
                  <span>{profile.email}</span>
                </div>
              </div>
              <nav className="portal-account-nav">
                {PORTAL_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.view}
                    className={activeView === item.view ? "portal-account-nav-link active" : "portal-account-nav-link"}
                    to={item.path}
                    aria-current={activeView === item.view ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    {item.view === "orders" ? <small>{orders.length}</small> : null}
                    {item.view === "addresses" ? <small>{addresses.length}</small> : null}
                  </Link>
                ))}
              </nav>
              <Link className="portal-account-shop-link" to="/shop">Continue shopping</Link>
              <button type="button" className="portal-account-logout" onClick={handleLogout}>Logout</button>
            </aside>

            <div className="portal-account-main">
              {error ? <p className="form-message form-message-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-message form-message-success" role="status">{notice}</p> : null}

              {activeView === "overview" ? (
                <OverviewView
                  profile={profile}
                  orders={orders}
                  paidOrders={paidOrders}
                  addresses={addresses}
                  defaultAddress={defaultAddress}
                  retryingOrderId={retryingOrderId}
                  onRetryPayment={handleRetryPayment}
                />
              ) : null}

              {activeView === "orders" ? (
                <OrdersView orders={orders} retryingOrderId={retryingOrderId} onRetryPayment={handleRetryPayment} />
              ) : null}

              {activeView === "addresses" ? (
                <CustomerAddressBook
                  addresses={addresses}
                  saving={savingAddress}
                  onCreate={handleAddressCreate}
                  onDelete={handleAddressDelete}
                />
              ) : null}

              {activeView === "profile" ? (
                <CustomerProfileSettings
                  profile={profile}
                  savingProfile={savingProfile}
                  savingPayment={savingPreference}
                  onSaveProfile={handleProfileSave}
                  onSavePayment={handlePreferenceSave}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type OverviewViewProps = {
  profile: CustomerProfile;
  orders: CustomerOrder[];
  paidOrders: number;
  addresses: CustomerAddress[];
  defaultAddress: CustomerAddress | null;
  retryingOrderId: number | null;
  onRetryPayment: (orderId: number) => void;
};

function OverviewView(props: OverviewViewProps) {
  const { profile, orders, paidOrders, addresses, defaultAddress, retryingOrderId, onRetryPayment } = props;
  return (
    <section className="portal-view-section" aria-labelledby="overview-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Overview</span>
          <h2 id="overview-heading">Welcome back, {firstName(profile.fullName)}</h2>
          <p>Here is the latest activity for your buyer account.</p>
        </div>
      </div>

      <div className="portal-summary-grid">
        <Link to="/portal/orders"><strong>{orders.length}</strong><span>Total orders</span></Link>
        <Link to="/portal/orders"><strong>{paidOrders}</strong><span>Paid orders</span></Link>
        <Link to="/portal/addresses"><strong>{addresses.length}</strong><span>Saved addresses</span></Link>
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
          {orders.slice(0, 2).map((order) => (
            <CustomerOrderCard key={order.id} order={order} retrying={retryingOrderId === order.id} onRetryPayment={onRetryPayment} />
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
};

function OrdersView({ orders, retryingOrderId, onRetryPayment }: OrdersViewProps) {
  return (
    <section className="portal-view-section" aria-labelledby="orders-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Purchases</span>
          <h2 id="orders-heading">Order history</h2>
          <p>Track status, payment, item quantities, and delivery location for every order.</p>
        </div>
        <Link className="button button-primary button-small" to="/shop">Shop Products</Link>
      </div>
      <div className="portal-orders-list">
        {orders.map((order) => (
          <CustomerOrderCard key={order.id} order={order} retrying={retryingOrderId === order.id} onRetryPayment={onRetryPayment} />
        ))}
      </div>
      {orders.length === 0 ? <OrdersEmptyState /> : null}
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
