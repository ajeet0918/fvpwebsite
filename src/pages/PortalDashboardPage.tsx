import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
import { clearCustomerAccessToken, isCustomerAuthenticated } from "../lib/customerAuth";
import type { CustomerAddress, CustomerOrder, CustomerProfile } from "../types/domain";

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PortalDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<number | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: true
  });

  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    deliveryAddress: "",
    city: "",
    state: "",
    postalCode: ""
  });

  const [paymentDraft, setPaymentDraft] = useState({
    preferredPaymentMethod: "",
    preferredPaymentHandle: ""
  });

  const paidOrders = useMemo(() => orders.filter((item) => item.paymentStatus === "PAID").length, [orders]);

  useEffect(() => {
    async function loadData() {
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
        setProfileDraft({
          fullName: profileResponse.fullName ?? "",
          companyName: profileResponse.companyName ?? "",
          phone: profileResponse.phone ?? "",
          deliveryAddress: profileResponse.deliveryAddress ?? "",
          city: profileResponse.city ?? "",
          state: profileResponse.state ?? "",
          postalCode: profileResponse.postalCode ?? ""
        });
        setPaymentDraft({
          preferredPaymentMethod: profileResponse.preferredPaymentMethod ?? "",
          preferredPaymentHandle: profileResponse.preferredPaymentHandle ?? ""
        });
      } catch (errorValue) {
        setError(readErrorMessage(errorValue, "Unable to load account data."));
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  if (!isCustomerAuthenticated()) {
    return <Navigate to="/portal/login" replace />;
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      const response = await updateCustomerProfileApi(profileDraft);
      setProfile(response);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to update profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePreferenceSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPreference(true);
    setError(null);
    try {
      const response = await updateCustomerPaymentPreferenceApi(paymentDraft);
      setProfile(response);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to update payment preference."));
    } finally {
      setSavingPreference(false);
    }
  }

  async function handleAddressCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    setError(null);
    try {
      await createCustomerAddressApi(addressForm);
      const list = await fetchCustomerAddressesApi();
      setAddresses(list);
      setAddressForm({
        label: "",
        recipientName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false
      });
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to save address."));
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(addressId: number) {
    try {
      await deleteCustomerAddressApi(addressId);
      setAddresses((current) => current.filter((item) => item.id !== addressId));
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to delete address."));
    }
  }

  async function handleRetryPayment(orderId: number) {
    setRetryingOrderId(orderId);
    setError(null);
    try {
      const session = await createOrderPaymentSessionApi(orderId, {
        checkoutSuccessUrl: `${window.location.origin}/portal`,
        checkoutFailureUrl: `${window.location.origin}/checkout`
      });
      if (session.paymentLink) {
        window.location.href = session.paymentLink;
        return;
      }
      setError(session.message || "Payment session is not available right now.");
      const refreshedOrders = await fetchCustomerOrdersApi();
      setOrders(refreshedOrders);
    } catch (errorValue) {
      setError(readErrorMessage(errorValue, "Unable to re-initiate payment."));
    } finally {
      setRetryingOrderId(null);
    }
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">My Account</span>
          <h2>Orders, Profile, and Saved Preferences</h2>
          <p>Track paid and pending orders, update profile, manage shipping addresses, and keep payment preferences.</p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                clearCustomerAccessToken();
                navigate("/portal/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        {loading ? <p>Loading account data...</p> : null}

        {!loading && profile ? (
          <>
            <div className="stats-band portal-stats-band">
              <article className="stats-item">
                <strong>{orders.length}</strong>
                <span>Total Orders</span>
              </article>
              <article className="stats-item">
                <strong>{paidOrders}</strong>
                <span>Paid Orders</span>
              </article>
              <article className="stats-item">
                <strong>{addresses.length}</strong>
                <span>Saved Addresses</span>
              </article>
              <article className="stats-item stats-item-identifier">
                <strong>{profile.email}</strong>
                <span>Account Email</span>
              </article>
            </div>

            <div className="portal-layout-grid">
              <article className="tracking-panel portal-panel">
                <h3>Order History</h3>
                {orders.map((order) => (
                  <div key={order.id} className="tracking-item-row">
                    <span>
                      {order.orderNumber}<br />
                      <small>{formatDate(order.createdAt)} | Status: {order.status}</small>
                    </span>
                    <strong>
                      {order.totalAmount ? formatCurrency(order.totalAmount, order.currency) : "-"}<br />
                      <small>Payment: {order.paymentStatus}</small>
                    </strong>
                    {(order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED" || order.paymentStatus === "NOT_INITIATED") ? (
                      <button
                        type="button"
                        className="button button-primary button-small"
                        onClick={() => void handleRetryPayment(order.id)}
                        disabled={retryingOrderId === order.id}
                      >
                        {retryingOrderId === order.id ? "Please wait..." : "Pay Now"}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
                {orders.length === 0 ? <p>No orders yet.</p> : null}
              </article>

              <article className="tracking-panel portal-panel">
                <h3>Saved Addresses</h3>
                {addresses.map((address) => (
                  <div key={address.id} className="address-row">
                    <div>
                      <strong>{address.label} {address.isDefault ? "(Default)" : ""}</strong>
                      <p>{address.recipientName} • {address.phone}</p>
                      <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                      <p>{address.city}, {address.state} {address.postalCode}, {address.country}</p>
                    </div>
                    <button type="button" className="button button-secondary button-small" onClick={() => handleDeleteAddress(address.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {addresses.length === 0 ? <p>No address saved yet.</p> : null}
              </article>
            </div>

            <div className="portal-layout-grid">
              <form className="order-form" onSubmit={handleProfileSave}>
                <h3>Profile</h3>
                <div className="form-grid two-up">
                  <label>
                    Full Name
                    <input value={profileDraft.fullName} onChange={(event) => setProfileDraft((p) => ({ ...p, fullName: event.target.value }))} required />
                  </label>
                  <label>
                    Company Name
                    <input value={profileDraft.companyName} onChange={(event) => setProfileDraft((p) => ({ ...p, companyName: event.target.value }))} />
                  </label>
                  <label>
                    Phone
                    <input value={profileDraft.phone} onChange={(event) => setProfileDraft((p) => ({ ...p, phone: event.target.value }))} required />
                  </label>
                  <label>
                    Delivery Address
                    <input value={profileDraft.deliveryAddress} onChange={(event) => setProfileDraft((p) => ({ ...p, deliveryAddress: event.target.value }))} required />
                  </label>
                  <label>
                    City
                    <input value={profileDraft.city} onChange={(event) => setProfileDraft((p) => ({ ...p, city: event.target.value }))} required />
                  </label>
                  <label>
                    State
                    <input value={profileDraft.state} onChange={(event) => setProfileDraft((p) => ({ ...p, state: event.target.value }))} required />
                  </label>
                  <label>
                    Postal Code
                    <input value={profileDraft.postalCode} onChange={(event) => setProfileDraft((p) => ({ ...p, postalCode: event.target.value }))} required />
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="button button-primary" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>

              <form className="order-form" onSubmit={handlePreferenceSave}>
                <h3>Payment Preference</h3>
                <div className="form-grid two-up">
                  <label>
                    Preferred Method
                    <input
                      placeholder="UPI / Card / Netbanking"
                      value={paymentDraft.preferredPaymentMethod}
                      onChange={(event) => setPaymentDraft((p) => ({ ...p, preferredPaymentMethod: event.target.value }))}
                    />
                  </label>
                  <label>
                    Preferred Handle
                    <input
                      placeholder="UPI ID or notes"
                      value={paymentDraft.preferredPaymentHandle}
                      onChange={(event) => setPaymentDraft((p) => ({ ...p, preferredPaymentHandle: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="button button-primary" disabled={savingPreference}>
                    {savingPreference ? "Saving..." : "Save Preference"}
                  </button>
                </div>
              </form>
            </div>

            <form className="order-form" onSubmit={handleAddressCreate}>
              <h3>Add New Address</h3>
              <div className="form-grid three-up">
                <label>
                  Label
                  <input value={addressForm.label} onChange={(event) => setAddressForm((p) => ({ ...p, label: event.target.value }))} required />
                </label>
                <label>
                  Recipient Name
                  <input value={addressForm.recipientName} onChange={(event) => setAddressForm((p) => ({ ...p, recipientName: event.target.value }))} required />
                </label>
                <label>
                  Phone
                  <input value={addressForm.phone} onChange={(event) => setAddressForm((p) => ({ ...p, phone: event.target.value }))} required />
                </label>
                <label>
                  Address Line 1
                  <input value={addressForm.line1} onChange={(event) => setAddressForm((p) => ({ ...p, line1: event.target.value }))} required />
                </label>
                <label>
                  Address Line 2
                  <input value={addressForm.line2} onChange={(event) => setAddressForm((p) => ({ ...p, line2: event.target.value }))} />
                </label>
                <label>
                  City
                  <input value={addressForm.city} onChange={(event) => setAddressForm((p) => ({ ...p, city: event.target.value }))} required />
                </label>
                <label>
                  State
                  <input value={addressForm.state} onChange={(event) => setAddressForm((p) => ({ ...p, state: event.target.value }))} required />
                </label>
                <label>
                  Postal Code
                  <input value={addressForm.postalCode} onChange={(event) => setAddressForm((p) => ({ ...p, postalCode: event.target.value }))} required />
                </label>
                <label>
                  Country
                  <input value={addressForm.country} onChange={(event) => setAddressForm((p) => ({ ...p, country: event.target.value }))} required />
                </label>
              </div>
              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(event) => setAddressForm((p) => ({ ...p, isDefault: event.target.checked }))}
                />
                <span>Set as default shipping address</span>
              </label>
              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={savingAddress}>
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </section>
  );
}

