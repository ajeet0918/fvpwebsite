import { FormEvent, useState } from "react";
import type { CustomerAddress } from "../../types/domain";

export type CustomerAddressDraft = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type CustomerAddressBookProps = {
  addresses: CustomerAddress[];
  saving: boolean;
  onCreate: (draft: CustomerAddressDraft) => Promise<boolean>;
  onDelete: (addressId: number) => Promise<boolean>;
};

const EMPTY_ADDRESS: CustomerAddressDraft = {
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
};

export function CustomerAddressBook({ addresses, saving, onCreate, onDelete }: CustomerAddressBookProps) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CustomerAddressDraft>({
    ...EMPTY_ADDRESS,
    isDefault: addresses.length === 0
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await onCreate(draft);
    if (!created) {
      return;
    }
    setDraft(EMPTY_ADDRESS);
    setShowForm(false);
  }

  async function handleDelete(addressId: number) {
    const deleted = await onDelete(addressId);
    if (deleted) {
      setPendingDeleteId(null);
    }
  }

  return (
    <section className="portal-view-section" aria-labelledby="addresses-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Delivery</span>
          <h2 id="addresses-heading">Saved addresses</h2>
          <p>Choose and maintain the delivery locations used during checkout.</p>
        </div>
        <button type="button" className="button button-primary button-small" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "Close Form" : "Add Address"}
        </button>
      </div>

      {addresses.length > 0 ? (
        <div className="portal-address-grid">
          {addresses.map((address) => (
            <article key={address.id} className="portal-address-card">
              <div className="portal-address-card-heading">
                <strong>{address.label}</strong>
                {address.isDefault ? <span>Default</span> : null}
              </div>
              <p><strong>{address.recipientName}</strong> &middot; {address.phone}</p>
              <address>
                {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
                {address.city}, {address.state} {address.postalCode}<br />
                {address.country}
              </address>
              {pendingDeleteId === address.id ? (
                <div className="portal-delete-confirmation" role="alert" aria-label={`Delete ${address.label} address`}>
                  <p>Delete this saved address? This action cannot be undone.</p>
                  <div>
                    <button type="button" className="button button-danger button-small" onClick={() => void handleDelete(address.id)}>
                      Delete Address
                    </button>
                    <button type="button" className="button button-secondary button-small" onClick={() => setPendingDeleteId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="button button-secondary button-small" onClick={() => setPendingDeleteId(address.id)}>
                  Delete
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="portal-empty-state">
          <strong>No saved address</strong>
          <p>Add a delivery address to make checkout faster.</p>
        </div>
      )}

      {showForm ? (
        <form className="order-form portal-address-form" onSubmit={handleSubmit}>
          <div className="portal-form-heading">
            <h3>Add a delivery address</h3>
            <p>Use the recipient and location details that should appear on the order.</p>
          </div>
          <div className="form-grid three-up">
            <label>Address label<input value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Home, Office, Warehouse" required /></label>
            <label>Recipient name<input value={draft.recipientName} onChange={(event) => setDraft((current) => ({ ...current, recipientName: event.target.value }))} autoComplete="name" required /></label>
            <label>Phone<input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" inputMode="tel" required /></label>
            <label>Address line 1<input value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} autoComplete="address-line1" required /></label>
            <label>Address line 2<input value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} autoComplete="address-line2" /></label>
            <label>City<input value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} autoComplete="address-level2" required /></label>
            <label>State<input value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} autoComplete="address-level1" required /></label>
            <label>Postal code<input value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} autoComplete="postal-code" inputMode="numeric" required /></label>
            <label>Country<input value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} autoComplete="country-name" required /></label>
          </div>
          <label className="inline-checkbox">
            <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((current) => ({ ...current, isDefault: event.target.checked }))} />
            <span>Use as my default shipping address</span>
          </label>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Save Address"}</button>
            <button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
