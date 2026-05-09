import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  createCustomerAddressApi,
  createDirectOrderApi,
  fetchCustomerAddressesApi,
  fetchProductsApi,
  readErrorMessage
} from "../lib/api";
import { clearCart, getCartItems, removeFromCart, updateCartQuantity } from "../lib/cart";
import { openCashfreeCheckout } from "../lib/cashfree";
import { isCustomerAuthenticated } from "../lib/customerAuth";
import type { CustomerAddress, Product } from "../types/domain";

function formatCurrency(value: number | null, currency = "INR") {
  if (value === null || value === undefined) {
    return "Price on request";
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [cartItems, setCartItemsState] = useState(() => getCartItems());
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  const cartLines = useMemo(() => {
    return cartItems
      .map((item) => {
        const product = products.find((entry) => entry.slug === item.productSlug);
        if (!product) {
          return null;
        }
        return {
          product,
          quantity: item.quantity,
          lineTotal: product.price ? product.price * item.quantity : null
        };
      })
      .filter((item): item is { product: Product; quantity: number; lineTotal: number | null } => Boolean(item));
  }, [cartItems, products]);

  const grandTotal = useMemo(() => {
    return cartLines.reduce((total, line) => total + (line.lineTotal ?? 0), 0);
  }, [cartLines]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [productResponse, addressResponse] = await Promise.all([
          fetchProductsApi(),
          fetchCustomerAddressesApi()
        ]);
        setProducts(productResponse);
        setAddresses(addressResponse);
        const defaultAddress = addressResponse.find((item) => item.isDefault) ?? addressResponse[0];
        setSelectedAddressId(defaultAddress ? defaultAddress.id : null);
      } catch (error) {
        setMessage(readErrorMessage(error, "Unable to load checkout data."));
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  if (!isCustomerAuthenticated()) {
    return <Navigate to="/portal/login?next=/checkout" replace />;
  }

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cartLines.length === 0) {
      setMessage("Add products to cart before checkout.");
      return;
    }
    if (!selectedAddressId) {
      setMessage("Add or select a shipping address.");
      return;
    }

    setSavingOrder(true);
    setMessage(null);
    try {
      const result = await createDirectOrderApi({
        addressId: selectedAddressId,
        customerNotes,
        checkoutSuccessUrl: `${window.location.origin}/portal`,
        checkoutFailureUrl: `${window.location.origin}/checkout`,
        items: cartLines.map((line) => ({
          productSlug: line.product.slug,
          quantity: line.quantity,
          unit: line.product.priceUnit || "kg"
        }))
      });

      clearCart();
      setCartItemsState([]);
      if (result.paymentLink) {
        window.location.href = result.paymentLink;
        return;
      }
      if (result.paymentSessionId) {
        await openCashfreeCheckout(result.paymentSessionId);
        return;
      }
      setMessage(result.message || "Order created. Payment session is ready in your account.");
      navigate("/portal", { replace: true });
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to place order."));
    } finally {
      setSavingOrder(false);
    }
  }

  async function createAddress() {
    if (!addressForm.label || !addressForm.recipientName || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postalCode || !addressForm.country) {
      setMessage("Complete all required address fields.");
      return;
    }
    setMessage(null);
    try {
      const created = await createCustomerAddressApi(addressForm);
      const next = await fetchCustomerAddressesApi();
      setAddresses(next);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
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
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to save address."));
    }
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Checkout</span>
          <h2>Direct Order and Payment</h2>
          <p>Review cart, select shipping address, and continue to secure Cashfree payment.</p>
        </div>

        {message ? <p className="form-message form-message-error">{message}</p> : null}
        {loading ? <p>Loading checkout...</p> : null}

        {!loading && (
          <div className="checkout-grid">
            <article className="tracking-panel">
              <h3>Cart Items</h3>
              {cartLines.map((line) => (
                <div key={line.product.slug} className="checkout-line-item">
                  <div>
                    <strong>{line.product.name}</strong>
                    <p>{formatCurrency(line.product.price)} / {line.product.priceUnit}</p>
                  </div>
                  <div className="checkout-line-actions">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) => {
                        const qty = Number(event.target.value);
                        const next = updateCartQuantity(line.product.slug, Number.isFinite(qty) && qty > 0 ? qty : 1);
                        setCartItemsState(next);
                      }}
                    />
                    <button type="button" className="button button-secondary button-small" onClick={() => {
                      const next = removeFromCart(line.product.slug);
                      setCartItemsState(next);
                    }}>
                      Remove
                    </button>
                  </div>
                  <strong>{formatCurrency(line.lineTotal)}</strong>
                </div>
              ))}
              {cartLines.length === 0 ? (
                <p>
                  Cart is empty. <Link to="/shop">Browse products</Link>
                </p>
              ) : null}
              <div className="checkout-total-row">
                <span>Total</span>
                <strong>{formatCurrency(grandTotal)}</strong>
              </div>
            </article>

            <form className="order-form" onSubmit={handlePlaceOrder}>
              <h3>Shipping and Payment</h3>
              <label>
                Select Address
                <select
                  value={selectedAddressId ?? ""}
                  onChange={(event) => setSelectedAddressId(event.target.value ? Number(event.target.value) : null)}
                  required
                >
                  <option value="">Choose address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} - {address.city}, {address.state} {address.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => setShowAddressForm((open) => !open)}
              >
                {showAddressForm ? "Hide Address Form" : "Add New Address"}
              </button>

              {showAddressForm ? (
                <div className="form-grid two-up">
                  <label>Label<input value={addressForm.label} onChange={(event) => setAddressForm((p) => ({ ...p, label: event.target.value }))} required /></label>
                  <label>Recipient<input value={addressForm.recipientName} onChange={(event) => setAddressForm((p) => ({ ...p, recipientName: event.target.value }))} required /></label>
                  <label>Phone<input value={addressForm.phone} onChange={(event) => setAddressForm((p) => ({ ...p, phone: event.target.value }))} required /></label>
                  <label>Line 1<input value={addressForm.line1} onChange={(event) => setAddressForm((p) => ({ ...p, line1: event.target.value }))} required /></label>
                  <label>Line 2<input value={addressForm.line2} onChange={(event) => setAddressForm((p) => ({ ...p, line2: event.target.value }))} /></label>
                  <label>City<input value={addressForm.city} onChange={(event) => setAddressForm((p) => ({ ...p, city: event.target.value }))} required /></label>
                  <label>State<input value={addressForm.state} onChange={(event) => setAddressForm((p) => ({ ...p, state: event.target.value }))} required /></label>
                  <label>Postal Code<input value={addressForm.postalCode} onChange={(event) => setAddressForm((p) => ({ ...p, postalCode: event.target.value }))} required /></label>
                  <label>Country<input value={addressForm.country} onChange={(event) => setAddressForm((p) => ({ ...p, country: event.target.value }))} required /></label>
                </div>
              ) : null}

              {showAddressForm ? (
                <div className="form-actions">
                  <button type="button" className="button button-secondary" onClick={() => void createAddress()}>
                    Save Address
                  </button>
                </div>
              ) : null}

              <label>
                Order Notes
                <textarea rows={3} value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
              </label>

              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={savingOrder || cartLines.length === 0}>
                  {savingOrder ? "Creating order..." : "Place Order & Pay"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
