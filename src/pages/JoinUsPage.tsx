import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  readErrorMessage,
  submitCollectionHubInquiryApi,
  submitFarmerInquiryApi,
  submitInvestorInquiryApi
} from "../lib/api";

type JoinType = "INVESTOR" | "FARMER" | "COLLECTION_HUB";

type JoinFormState = {
  fullName: string;
  fatherName: string;
  mobileNumber: string;
  alternateNumber: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  farmingType: string;
  landArea: string;
  mainCrops: string;
  irrigationType: string;
  collectionHubName: string;
  storageType: string;
  capacityMt: string;
  pickupRadiusKm: string;
  operatingDays: string;
  investmentAmount: string;
  investmentDate: string;
  notes: string;
  termsAccepted: boolean;
};

const initialState: JoinFormState = {
  fullName: "",
  fatherName: "",
  mobileNumber: "",
  alternateNumber: "",
  email: "",
  aadhaarNumber: "",
  panNumber: "",
  address: "",
  village: "",
  district: "",
  state: "",
  pinCode: "",
  farmingType: "",
  landArea: "",
  mainCrops: "",
  irrigationType: "",
  collectionHubName: "",
  storageType: "",
  capacityMt: "",
  pickupRadiusKm: "",
  operatingDays: "",
  investmentAmount: "",
  investmentDate: "",
  notes: "",
  termsAccepted: false
};

export function JoinUsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [joinType, setJoinType] = useState<JoinType | null>(parseJoinType(searchParams.get("type")));
  const [form, setForm] = useState<JoinFormState>(initialState);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<File | null>(null);
  const [landProofDocument, setLandProofDocument] = useState<File | null>(null);
  const [hubDocument, setHubDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const nextType = parseJoinType(searchParams.get("type"));
    setJoinType(nextType);
  }, [searchParams]);

  const termsPdfPath = useMemo(() => {
    if (joinType === "FARMER" || joinType === "COLLECTION_HUB") {
      return "/assets/farmer-terms.pdf";
    }
    return "/assets/investor-terms.pdf";
  }, [joinType]);

  function setField<K extends keyof JoinFormState>(field: K, value: JoinFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchJoinType(nextType: JoinType) {
    setJoinType(nextType);
    setSearchParams({ type: nextType === "COLLECTION_HUB" ? "collection-hub" : nextType.toLowerCase() });
    setForm(initialState);
    setMessage(null);
    setIdProof(null);
    setAadhaarDocument(null);
    setLandProofDocument(null);
    setHubDocument(null);
  }

  function selectTypeAndFocus(nextType: JoinType) {
    switchJoinType(nextType);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinType) {
      setMessage("Select Investor, Farmer, or Collection Hub from above CTA to open the form.");
      return;
    }
    setSubmitting(true);
    setMessage(null);

    try {
      if (joinType === "INVESTOR") {
        const response = await submitInvestorInquiryApi(
          {
            fullName: form.fullName,
            fatherName: form.fatherName,
            mobileNumber: form.mobileNumber,
            email: form.email,
            aadhaarNumber: form.aadhaarNumber,
            panNumber: form.panNumber,
            fullAddress: form.address,
            investmentAmount: Number(form.investmentAmount),
            investmentDate: form.investmentDate,
            notes: form.notes.trim() || undefined,
            termsAccepted: form.termsAccepted
          },
          { idProof }
        );

        setMessage(
          `Submitted successfully. Reference ID: ${response.referenceId ?? "Pending"}.
Payment request will be shared after admin verification.`
        );
      } else if (joinType === "FARMER") {
        if (!aadhaarDocument) {
          throw new Error("Aadhaar upload is required for farmer registration.");
        }
        const response = await submitFarmerInquiryApi(
          {
            fullName: form.fullName,
            fatherName: form.fatherName,
            mobileNumber: form.mobileNumber,
            alternateNumber: form.alternateNumber || undefined,
            email: form.email,
            aadhaarNumber: form.aadhaarNumber,
            address: form.address,
            village: form.village,
            district: form.district,
            state: form.state,
            pinCode: form.pinCode,
            farmingType: form.farmingType,
            landArea: form.landArea,
            mainCrops: form.mainCrops,
            irrigationType: form.irrigationType,
            notes: form.notes.trim() || undefined,
            termsAccepted: form.termsAccepted
          },
          {
            aadhaarDocument,
            landProofDocument
          }
        );

        setMessage(
          `Submitted successfully. Reference ID: ${response.referenceId ?? "Pending"}.
Bank account details will be requested after admin approval.`
        );
      } else {
        const response = await submitCollectionHubInquiryApi(
          {
            fullName: form.fullName,
            fatherName: form.fatherName,
            mobileNumber: form.mobileNumber,
            alternateNumber: form.alternateNumber || undefined,
            email: form.email,
            aadhaarNumber: form.aadhaarNumber,
            address: form.address,
            village: form.village,
            district: form.district,
            state: form.state,
            pinCode: form.pinCode,
            collectionHubName: form.collectionHubName,
            storageType: form.storageType,
            capacityMt: Number(form.capacityMt),
            pickupRadiusKm: Number(form.pickupRadiusKm),
            operatingDays: form.operatingDays,
            notes: form.notes.trim() || undefined,
            termsAccepted: form.termsAccepted
          },
          {
            hubDocument
          }
        );

        setMessage(
          `Submitted successfully. Reference ID: ${response.referenceId ?? "Pending"}.
Admin will verify and share next onboarding steps for your collection hub.`
        );
      }

      setForm(initialState);
      setIdProof(null);
      setAadhaarDocument(null);
      setLandProofDocument(null);
      setHubDocument(null);
    } catch (error) {
      setMessage(readErrorMessage(error, "Unable to submit your request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-heading section-heading-left">
          <span className="section-badge">Join With Us</span>
          <h2>Investor, Farmer, and Collection Hub Onboarding</h2>
          <p>
            Submit your basic profile first. Verification and next-step actions are shared by admin after review.
          </p>
        </div>

        <article className="order-form join-intro-card">
          <div className="form-grid three-up join-intro-grid">
            <div className={`join-type-card ${joinType === "INVESTOR" ? "join-type-card-active" : ""}`}>
              <h3>Why Join as Investor?</h3>
              <p>Participate in growth programs with documented verification and controlled payment process.</p>
              <button
                type="button"
                className="button button-primary button-small"
                onClick={() => selectTypeAndFocus("INVESTOR")}
              >
                Fill Investor Form
              </button>
            </div>
            <div className={`join-type-card ${joinType === "FARMER" ? "join-type-card-active" : ""}`}>
              <h3>Why Join as Farmer?</h3>
              <p>Get onboarded as a sourcing partner through verification-led profile evaluation.</p>
              <button
                type="button"
                className="button button-primary button-small"
                onClick={() => selectTypeAndFocus("FARMER")}
              >
                Fill Farmer Form
              </button>
            </div>
            <div className={`join-type-card ${joinType === "COLLECTION_HUB" ? "join-type-card-active" : ""}`}>
              <h3>Open Collection Hub</h3>
              <p>Register your local collection point and partner with us for procurement and aggregation operations.</p>
              <button
                type="button"
                className="button button-primary button-small"
                onClick={() => selectTypeAndFocus("COLLECTION_HUB")}
              >
                Fill Collection Hub Form
              </button>
            </div>
          </div>
        </article>

        {joinType ? (
          <form ref={formRef} className="order-form join-form" onSubmit={handleSubmit}>
          <div className="form-grid two-up">
            <label>
              Selected Form Type
              <input
                value={
                  joinType === "INVESTOR"
                    ? "Investor"
                    : joinType === "FARMER"
                      ? "Farmer"
                      : "Collection Hub"
                }
                readOnly
              />
            </label>
            <label>
              Terms & Conditions (PDF)
              <a className="button button-secondary join-pdf-link" href={termsPdfPath} target="_blank" rel="noreferrer">
                View {joinType === "INVESTOR" ? "Investor" : "Farmer/Hub"} Terms PDF
              </a>
            </label>
          </div>

          <div className="form-grid two-up">
            <label>Full Name<input value={form.fullName} onChange={(event) => setField("fullName", event.target.value)} required /></label>
            <label>Father Name<input value={form.fatherName} onChange={(event) => setField("fatherName", event.target.value)} required /></label>
            <label>Mobile Number<input value={form.mobileNumber} onChange={(event) => setField("mobileNumber", event.target.value)} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} required /></label>
            <label>Aadhaar Number<input value={form.aadhaarNumber} onChange={(event) => setField("aadhaarNumber", event.target.value)} required /></label>
            {joinType === "INVESTOR" ? (
              <label>PAN Number<input value={form.panNumber} onChange={(event) => setField("panNumber", event.target.value.toUpperCase())} required /></label>
            ) : (
              <label>Alternate Number<input value={form.alternateNumber} onChange={(event) => setField("alternateNumber", event.target.value)} /></label>
            )}
          </div>

          <div className="form-grid">
            <label>Address<textarea rows={3} value={form.address} onChange={(event) => setField("address", event.target.value)} required /></label>
          </div>

          {joinType === "INVESTOR" ? (
            <>
              <div className="form-grid two-up">
                <label>Investment Amount (INR)<input type="number" min="1" step="0.01" value={form.investmentAmount} onChange={(event) => setField("investmentAmount", event.target.value)} required /></label>
                <label>Preferred Start Date<input type="date" value={form.investmentDate} onChange={(event) => setField("investmentDate", event.target.value)} required /></label>
              </div>
              <div className="form-grid">
                <label>ID Proof Upload (optional)<input type="file" accept="image/*,.pdf" onChange={(event) => setIdProof(event.target.files?.[0] ?? null)} /></label>
              </div>
              <p className="join-note">Payment details are collected only after admin verifies your profile and confirms the next step.</p>
            </>
          ) : joinType === "FARMER" ? (
            <>
              <div className="form-grid three-up">
                <label>Village<input value={form.village} onChange={(event) => setField("village", event.target.value)} required /></label>
                <label>District<input value={form.district} onChange={(event) => setField("district", event.target.value)} required /></label>
                <label>State<input value={form.state} onChange={(event) => setField("state", event.target.value)} required /></label>
              </div>
              <div className="form-grid three-up">
                <label>PIN Code<input value={form.pinCode} onChange={(event) => setField("pinCode", event.target.value)} required /></label>
                <label>Farming Type<input value={form.farmingType} onChange={(event) => setField("farmingType", event.target.value)} required /></label>
                <label>Land Area<input value={form.landArea} onChange={(event) => setField("landArea", event.target.value)} required /></label>
              </div>
              <div className="form-grid">
                <label>Main Crops<input value={form.mainCrops} onChange={(event) => setField("mainCrops", event.target.value)} required /></label>
              </div>
              <div className="form-grid">
                <label>Irrigation Type<input value={form.irrigationType} onChange={(event) => setField("irrigationType", event.target.value)} required /></label>
              </div>
              <div className="form-grid two-up">
                <label>Aadhaar Upload<input type="file" accept="image/*,.pdf" onChange={(event) => setAadhaarDocument(event.target.files?.[0] ?? null)} required /></label>
                <label>Land Proof (optional)<input type="file" accept="image/*,.pdf" onChange={(event) => setLandProofDocument(event.target.files?.[0] ?? null)} /></label>
              </div>
              <p className="join-note">Bank account details are collected only after farmer profile approval.</p>
            </>
          ) : (
            <>
              <div className="form-grid three-up">
                <label>Village<input value={form.village} onChange={(event) => setField("village", event.target.value)} required /></label>
                <label>District<input value={form.district} onChange={(event) => setField("district", event.target.value)} required /></label>
                <label>State<input value={form.state} onChange={(event) => setField("state", event.target.value)} required /></label>
              </div>
              <div className="form-grid three-up">
                <label>PIN Code<input value={form.pinCode} onChange={(event) => setField("pinCode", event.target.value)} required /></label>
                <label>Storage Type<input value={form.storageType} onChange={(event) => setField("storageType", event.target.value)} required /></label>
                <label>Operating Days<input value={form.operatingDays} onChange={(event) => setField("operatingDays", event.target.value)} required /></label>
              </div>
              <div className="form-grid three-up">
                <label>Collection Hub Name<input value={form.collectionHubName} onChange={(event) => setField("collectionHubName", event.target.value)} required /></label>
                <label>Capacity (MT)<input type="number" min="0.01" step="0.01" value={form.capacityMt} onChange={(event) => setField("capacityMt", event.target.value)} required /></label>
                <label>Pickup Radius (KM)<input type="number" min="1" step="1" value={form.pickupRadiusKm} onChange={(event) => setField("pickupRadiusKm", event.target.value)} required /></label>
              </div>
              <div className="form-grid">
                <label>Hub Document (optional)<input type="file" accept="image/*,.pdf" onChange={(event) => setHubDocument(event.target.files?.[0] ?? null)} /></label>
              </div>
              <p className="join-note">Operations and payout process are shared once hub profile verification is completed.</p>
            </>
          )}

          <div className="form-grid">
            <label>Notes (optional)<textarea rows={3} value={form.notes} onChange={(event) => setField("notes", event.target.value)} /></label>
          </div>
          <div className="inline-checkbox">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(event) => setField("termsAccepted", event.target.checked)}
              required
            />
            <span>
              I have read and accepted the{" "}
              {joinType === "INVESTOR" ? "investor" : joinType === "FARMER" ? "farmer" : "collection hub"} terms and conditions.
            </span>
          </div>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
          {message ? <p className="form-message">{message}</p> : null}
          </form>
        ) : (
          <article className="order-form">
            <p className="join-note">Select one CTA above to start filling the form.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function parseJoinType(value: string | null): JoinType | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "INVESTOR" || normalized === "FARMER" || normalized === "COLLECTION_HUB") {
    return normalized;
  }
  if (normalized === "COLLECTION-HUB" || normalized === "COLLECTIONHUB") {
    return "COLLECTION_HUB";
  }
  return null;
}
