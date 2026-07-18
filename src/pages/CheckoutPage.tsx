import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
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
import { resolveDocumentImageUrl } from "../lib/documents";
import { localProductImages } from "../data/productImages";
import type { CustomerAddress, Product } from "../types/domain";

type OrderCreatedState = {
  orderNumber: string;
  message: string;
};

function formatCurrency(value: number | null, currency = "INR") {
  if (value === null || value === undefined) {
    return "Price on request";
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

function resolveProductImage(product: Product) {
  return resolveDocumentImageUrl({
    documentId: product.imageDocumentId,
    legacyUrl: product.imageUrl,
    fallbackUrl: localProductImages[product.slug] ?? "/assets/product-seeds.jpg"
  });
}

function resolveFallbackImage(product: Product) {
  return localProductImages[product.slug] ?? "/assets/product-seeds.jpg";
}

export function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [cartItems, setCartItemsState] = useState(() => getCartItems());
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [orderCreated, setOrderCreated] = useState<OrderCreatedState | null>(null);
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

  const totalQuantity = useMemo(() => {
    return cartLines.reduce((total, line) => total + line.quantity, 0);
  }, [cartLines]);

  const selectedAddress = useMemo(() => {
    return addresses.find((address) => address.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

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
    if (!policyAccepted) {
      setMessage("Accept the buyer policies before placing the order.");
      return;
    }

    setSavingOrder(true);
    setMessage(null);
    setOrderCreated(null);
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
      setOrderCreated({
        orderNumber: result.orderNumber,
        message: result.message || "Your order was created and is available in your account."
      });
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
    <section className="section page-top checkout-page">
      <div className="container">
        <div className="section-heading section-heading-left checkout-page-heading">
          <span className="section-badge">Checkout</span>
          <h1>Review your wholesale order</h1>
          <p>Confirm quantities and delivery details before continuing to secure payment.</p>
          <div className="checkout-steps" aria-label="Checkout progress">
            <span className="checkout-step checkout-step-active"><strong>1</strong> Review cart</span>
            <span className="checkout-step"><strong>2</strong> Delivery details</span>
            <span className="checkout-step"><strong>3</strong> Payment</span>
          </div>
        </div>

        {message ? <p className="form-message form-message-error">{message}</p> : null}
        {loading ? <div className="checkout-loading-state">Loading your cart and delivery details...</div> : null}

        {orderCreated ? (
          <article className="checkout-success-panel">
            <span className="checkout-success-icon" aria-hidden="true">&#10003;</span>
            <div>
              <span className="section-badge">Order received</span>
              <h2>Order {orderCreated.orderNumber} was created</h2>
              <p>{orderCreated.message}</p>
              <div className="checkout-success-actions">
                <Link className="button button-primary" to="/portal">View My Orders</Link>
                <Link className="button button-secondary" to="/shop">Continue Shopping</Link>
              </div>
            </div>
          </article>
        ) : !loading && (
          <div className="checkout-grid">
            <article className="tracking-panel checkout-cart-panel">
              <div className="checkout-panel-heading">
                <div>
                  <span className="checkout-panel-kicker">Order review</span>
                  <h2>Cart items</h2>
                </div>
                <span className="checkout-item-count">{totalQuantity} {totalQuantity === 1 ? "item" : "items"}</span>
              </div>
              {cartLines.map((line) => (
                <div key={line.product.slug} className="checkout-line-item">
                  <div className="checkout-line-image">
                    <img
                      src={resolveProductImage(line.product)}
                      alt={line.product.name}
                      onError={(event) => {
                        event.currentTarget.src = resolveFallbackImage(line.product);
                      }}
                    />
                  </div>
                  <div className="checkout-line-product">
                    <span>{line.product.category}</span>
                    <strong>{line.product.name}</strong>
                    <p>{formatCurrency(line.product.price)} per {line.product.priceUnit}</p>
                    {line.product.moq ? <small>MOQ: {line.product.moq}</small> : null}
                  </div>
                  <div className="checkout-line-total">
                    <span>Item total</span>
                    <strong>{formatCurrency(line.lineTotal)}</strong>
                  </div>
                  <div className="checkout-line-actions">
                    <div className="checkout-quantity-field">
                      <span id={`quantity-label-${line.product.slug}`}>Quantity</span>
                      <div className="checkout-quantity-control">
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${line.product.name}`}
                          disabled={line.quantity <= 1}
                          onClick={() => {
                            setCartItemsState(updateCartQuantity(line.product.slug, line.quantity - 1));
                          }}
                        >
                          &minus;
                        </button>
                      <input
                        aria-labelledby={`quantity-label-${line.product.slug}`}
                        aria-label={`Quantity for ${line.product.name}`}
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) => {
                          const qty = Number(event.target.value);
                          const next = updateCartQuantity(line.product.slug, Number.isFinite(qty) && qty > 0 ? qty : 1);
                          setCartItemsState(next);
                        }}
                      />
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${line.product.name}`}
                          onClick={() => {
                            setCartItemsState(updateCartQuantity(line.product.slug, line.quantity + 1));
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button type="button" className="checkout-remove-button" onClick={() => {
                      setCartItemsState(removeFromCart(line.product.slug));
                    }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {cartLines.length === 0 ? (
                <div className="checkout-empty-state">
                  <strong>Your cart is empty</strong>
                  <p>Add products from the catalog to prepare a wholesale order.</p>
                  <Link className="button button-primary button-small" to="/shop">Browse Products</Link>
                </div>
              ) : null}
              {cartLines.length > 0 ? (
                <div className="checkout-cart-footer">
                  <Link to="/shop">Continue shopping</Link>
                  <div className="checkout-total-row">
                    <span>Products subtotal</span>
                    <strong>{formatCurrency(grandTotal)}</strong>
                  </div>
                </div>
              ) : null}
            </article>

            <form className="order-form checkout-order-panel" onSubmit={handlePlaceOrder}>
              <div className="checkout-panel-heading">
                <div>
                  <span className="checkout-panel-kicker">Delivery</span>
                  <h2>Shipping and payment</h2>
                </div>
              </div>

              <label className="checkout-field-label">
                Delivery address
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
              {selectedAddress ? (
                <address className="checkout-selected-address">
                  <strong>{selectedAddress.recipientName}</strong>
                  <span>{selectedAddress.phone}</span>
                  <span>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}</span>
                  <span>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</span>
                </address>
              ) : null}
              <button
                type="button"
                className="checkout-address-toggle"
                onClick={() => setShowAddressForm((open) => !open)}
              >
                {showAddressForm ? "Cancel new address" : "+ Add another address"}
              </button>

              {showAddressForm ? (
                <div className="checkout-address-form">
                  <div className="form-grid two-up">
                    <label>Address label<input value={addressForm.label} onChange={(event) => setAddressForm((p) => ({ ...p, label: event.target.value }))} placeholder="Home, office, warehouse" required /></label>
                    <label>Recipient name<input value={addressForm.recipientName} onChange={(event) => setAddressForm((p) => ({ ...p, recipientName: event.target.value }))} autoComplete="name" required /></label>
                    <label>Phone<input value={addressForm.phone} onChange={(event) => setAddressForm((p) => ({ ...p, phone: event.target.value }))} autoComplete="tel" inputMode="tel" required /></label>
                    <label>Address line 1<input value={addressForm.line1} onChange={(event) => setAddressForm((p) => ({ ...p, line1: event.target.value }))} autoComplete="address-line1" required /></label>
                    <label>Address line 2<input value={addressForm.line2} onChange={(event) => setAddressForm((p) => ({ ...p, line2: event.target.value }))} autoComplete="address-line2" /></label>
                    <label>City<input value={addressForm.city} onChange={(event) => setAddressForm((p) => ({ ...p, city: event.target.value }))} autoComplete="address-level2" required /></label>
                    <label>State<input value={addressForm.state} onChange={(event) => setAddressForm((p) => ({ ...p, state: event.target.value }))} autoComplete="address-level1" required /></label>
                    <label>Postal code<input value={addressForm.postalCode} onChange={(event) => setAddressForm((p) => ({ ...p, postalCode: event.target.value }))} autoComplete="postal-code" inputMode="numeric" required /></label>
                    <label>Country<input value={addressForm.country} onChange={(event) => setAddressForm((p) => ({ ...p, country: event.target.value }))} autoComplete="country-name" required /></label>
                  </div>
                  <button type="button" className="button button-secondary button-small" onClick={() => void createAddress()}>
                    Save Address
                  </button>
                </div>
              ) : null}

              <label className="checkout-field-label">
                Order notes <span>Optional</span>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(event) => setCustomerNotes(event.target.value)}
                  placeholder="Add delivery instructions or product requirements"
                />
              </label>

              <div className="policy-acknowledgement">
                <label className="inline-checkbox">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(event) => setPolicyAccepted(event.target.checked)}
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/policies#terms">Terms</Link>,{" "}
                    <Link to="/policies#shipping-delivery">Shipping & Delivery</Link>,{" "}
                    <Link to="/policies#cancellation">Cancellation</Link>, and{" "}
                    <Link to="/policies#return-refund">Return/Refund</Link> policies.
                  </span>
                </label>
              </div>

              <div className="checkout-payment-summary">
                <div>
                  <span>Estimated total</span>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </div>
                <p>Payment is completed securely through Cashfree after your order is created.</p>
                <button type="submit" className="button button-primary" disabled={savingOrder || cartLines.length === 0}>
                  {savingOrder ? "Creating order..." : "Place Order & Continue to Payment"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
