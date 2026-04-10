import { FormEvent, useEffect, useState } from "react";
import { createOrderApi, fetchProductsApi, readErrorMessage } from "../lib/api";
import type { OrderFormState, Product } from "../types/domain";

const initialOrderForm: OrderFormState = {
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  deliveryAddress: "",
  city: "",
  state: "",
  postalCode: "",
  customerNotes: "",
  items: [{ productSlug: "", quantity: "1", unit: "kg" }]
};

export function OrderRequestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderForm, setOrderForm] = useState<OrderFormState>(initialOrderForm);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [orderFormMessage, setOrderFormMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProducts(await fetchProductsApi());
      } catch (error) {
        setPageError(readErrorMessage(error, "Unable to load products."));
      } finally {
        setLoadingProducts(false);
      }
    }

    void loadProducts();
  }, []);

  function setOrderField<K extends keyof Omit<OrderFormState, "items">>(field: K, value: string) {
    setOrderForm((current) => ({ ...current, [field]: value }));
  }

  function setItemField(index: number, field: "productSlug" | "quantity" | "unit", value: string) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    }));
  }

  function addItemRow() {
    setOrderForm((current) => ({
      ...current,
      items: [...current.items, { productSlug: "", quantity: "1", unit: "kg" }]
    }));
  }

  function removeItemRow(index: number) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleOrderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingOrder(true);
    setOrderFormMessage(null);

    try {
      const created = await createOrderApi({
        ...orderForm,
        items: orderForm.items.map((item) => ({
          productSlug: item.productSlug,
          quantity: Number(item.quantity),
          unit: item.unit
        }))
      });

      setOrderForm(initialOrderForm);
      setOrderFormMessage(`Order request created. Tracking ID: ${created.orderNumber}`);
    } catch (error) {
      setOrderFormMessage(readErrorMessage(error, "Unable to create order request."));
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <section className="section page-top">
      <div className="container">
        {pageError ? <div className="banner-error">{pageError}</div> : null}
        <div className="section-heading section-heading-left">
          <span className="section-badge">Request Order</span>
          <h2>Create a Bulk Order Request</h2>
          <p>This page is customer-facing. You can track the order separately using your tracking ID.</p>
        </div>

        <form className="order-form" onSubmit={handleOrderSubmit}>
          <div className="form-grid two-up">
            <label>Full Name<input value={orderForm.fullName} onChange={(event) => setOrderField("fullName", event.target.value)} required /></label>
            <label>Company Name<input value={orderForm.companyName} onChange={(event) => setOrderField("companyName", event.target.value)} required /></label>
            <label>Email<input type="email" value={orderForm.email} onChange={(event) => setOrderField("email", event.target.value)} required /></label>
            <label>Phone<input value={orderForm.phone} onChange={(event) => setOrderField("phone", event.target.value)} required /></label>
          </div>
          <div className="form-grid">
            <label>Delivery Address<textarea value={orderForm.deliveryAddress} onChange={(event) => setOrderField("deliveryAddress", event.target.value)} rows={3} required /></label>
          </div>
          <div className="form-grid three-up">
            <label>City<input value={orderForm.city} onChange={(event) => setOrderField("city", event.target.value)} required /></label>
            <label>State<input value={orderForm.state} onChange={(event) => setOrderField("state", event.target.value)} required /></label>
            <label>Postal Code<input value={orderForm.postalCode} onChange={(event) => setOrderField("postalCode", event.target.value)} required /></label>
          </div>
          <div className="form-grid">
            <label>Requirement Notes<textarea value={orderForm.customerNotes} onChange={(event) => setOrderField("customerNotes", event.target.value)} rows={4} required /></label>
          </div>

          <div className="line-item-panel">
            <div className="line-item-header">
              <h3>Order Items</h3>
              <button type="button" className="button button-secondary" onClick={addItemRow}>Add Item</button>
            </div>

            {orderForm.items.map((item, index) => (
              <div key={`${index}-${item.productSlug}`} className="line-item-row">
                <label>
                  Product
                  <select value={item.productSlug} onChange={(event) => setItemField(index, "productSlug", event.target.value)} required>
                    <option value="">Select a product</option>
                    {products.map((product) => <option key={product.id} value={product.slug}>{product.name}</option>)}
                  </select>
                </label>
                <label>Quantity<input type="number" min="1" value={item.quantity} onChange={(event) => setItemField(index, "quantity", event.target.value)} required /></label>
                <label>Unit<input value={item.unit} onChange={(event) => setItemField(index, "unit", event.target.value)} required /></label>
                <button type="button" className="line-item-remove" disabled={orderForm.items.length === 1} onClick={() => removeItemRow(index)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={submittingOrder || loadingProducts}>
              {submittingOrder ? "Submitting..." : loadingProducts ? "Loading products..." : "Create Order Request"}
            </button>
          </div>
          {orderFormMessage ? <p className="form-message">{orderFormMessage}</p> : null}
        </form>
      </div>
    </section>
  );
}
