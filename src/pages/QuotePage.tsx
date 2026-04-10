import { FormEvent, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";

export function QuotePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page">
      <section className="panel">
        <SectionTitle
          eyebrow="Bulk Inquiry"
          title="Capture high-intent wholesale requests"
          description="The current form demonstrates the frontend flow. It can be wired to the backend inquiry API immediately."
        />
        <form className="inquiry-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Full name" required />
          <input type="text" placeholder="Company name" required />
          <input type="email" placeholder="Email address" required />
          <input type="tel" placeholder="Phone number" required />
          <input type="text" placeholder="Product of interest" required />
          <textarea placeholder="Tell us your quantity and requirements" rows={5} required />
          <button className="button primary" type="submit">
            Submit Inquiry
          </button>
          {submitted ? <p className="success">Starter flow complete. Connect this to `/api/inquiries` next.</p> : null}
        </form>
      </section>
    </div>
  );
}
