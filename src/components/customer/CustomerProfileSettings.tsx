import { FormEvent, useEffect, useState } from "react";
import type { CustomerProfile } from "../../types/domain";

export type CustomerProfileDraft = {
  fullName: string;
  companyName: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CustomerPaymentDraft = {
  preferredPaymentMethod: string;
  preferredPaymentHandle: string;
};

type CustomerProfileSettingsProps = {
  profile: CustomerProfile;
  savingProfile: boolean;
  savingPayment: boolean;
  onSaveProfile: (draft: CustomerProfileDraft) => Promise<boolean>;
  onSavePayment: (draft: CustomerPaymentDraft) => Promise<boolean>;
};

function createProfileDraft(profile: CustomerProfile): CustomerProfileDraft {
  return {
    fullName: profile.fullName ?? "",
    companyName: profile.companyName ?? "",
    phone: profile.phone ?? "",
    deliveryAddress: profile.deliveryAddress ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    postalCode: profile.postalCode ?? ""
  };
}

export function CustomerProfileSettings(props: CustomerProfileSettingsProps) {
  const { profile, savingProfile, savingPayment, onSaveProfile, onSavePayment } = props;
  const [profileDraft, setProfileDraft] = useState(() => createProfileDraft(profile));
  const [paymentDraft, setPaymentDraft] = useState<CustomerPaymentDraft>({
    preferredPaymentMethod: profile.preferredPaymentMethod ?? "",
    preferredPaymentHandle: profile.preferredPaymentHandle ?? ""
  });

  useEffect(() => {
    setProfileDraft(createProfileDraft(profile));
    setPaymentDraft({
      preferredPaymentMethod: profile.preferredPaymentMethod ?? "",
      preferredPaymentHandle: profile.preferredPaymentHandle ?? ""
    });
  }, [profile]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSaveProfile(profileDraft);
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSavePayment(paymentDraft);
  }

  return (
    <section className="portal-view-section" aria-labelledby="profile-heading">
      <div className="portal-view-heading">
        <div>
          <span className="portal-panel-kicker">Account</span>
          <h2 id="profile-heading">Profile and preferences</h2>
          <p>Keep your buyer details accurate for orders, delivery coordination, and payment.</p>
        </div>
      </div>

      <div className="portal-settings-grid">
        <form className="order-form" onSubmit={handleProfileSubmit}>
          <div className="portal-form-heading">
            <h3>Buyer details</h3>
            <p>Your email address is used as the account identifier and cannot be changed here.</p>
          </div>
          <label>Account email<input value={profile.email} readOnly aria-readonly="true" /></label>
          <div className="form-grid two-up">
            <label>Full name<input value={profileDraft.fullName} onChange={(event) => setProfileDraft((current) => ({ ...current, fullName: event.target.value }))} autoComplete="name" required /></label>
            <label>Company name<input value={profileDraft.companyName} onChange={(event) => setProfileDraft((current) => ({ ...current, companyName: event.target.value }))} autoComplete="organization" /></label>
            <label>Phone<input value={profileDraft.phone} onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" inputMode="tel" required /></label>
            <label>Primary address<input value={profileDraft.deliveryAddress} onChange={(event) => setProfileDraft((current) => ({ ...current, deliveryAddress: event.target.value }))} autoComplete="street-address" required /></label>
            <label>City<input value={profileDraft.city} onChange={(event) => setProfileDraft((current) => ({ ...current, city: event.target.value }))} autoComplete="address-level2" required /></label>
            <label>State<input value={profileDraft.state} onChange={(event) => setProfileDraft((current) => ({ ...current, state: event.target.value }))} autoComplete="address-level1" required /></label>
            <label>Postal code<input value={profileDraft.postalCode} onChange={(event) => setProfileDraft((current) => ({ ...current, postalCode: event.target.value }))} autoComplete="postal-code" inputMode="numeric" required /></label>
          </div>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</button>
          </div>
        </form>

        <form className="order-form" onSubmit={handlePaymentSubmit}>
          <div className="portal-form-heading">
            <h3>Payment preference</h3>
            <p>This preference helps preselect a method. Payment is still completed through the secure checkout.</p>
          </div>
          <label>Preferred method<input value={paymentDraft.preferredPaymentMethod} onChange={(event) => setPaymentDraft((current) => ({ ...current, preferredPaymentMethod: event.target.value }))} placeholder="UPI, card, or net banking" /></label>
          <label>Preferred handle or note<input value={paymentDraft.preferredPaymentHandle} onChange={(event) => setPaymentDraft((current) => ({ ...current, preferredPaymentHandle: event.target.value }))} placeholder="Optional UPI ID or payment note" /></label>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={savingPayment}>{savingPayment ? "Saving..." : "Save Preference"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
