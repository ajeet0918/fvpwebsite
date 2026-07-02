import { policyLinks, companyLegalDetails } from "../data/policies";
import { policyFullTexts } from "../data/policyFullTexts";

function isPolicyHeading(line: string) {
  return /^(\d+\.|Part \d+|End of )/.test(line) || /^[A-Z][A-Z &,()/-]{8,}$/.test(line);
}

export function PoliciesPage() {
  return (
    <section className="section page-top policies-page">
      <div className="container">
        <div className="policy-hero">
          <span className="section-badge">Legal & Buyer Policies</span>
          <h1>FVP Purepick Legal and Buyer Policy Center</h1>
          <p>
            Review the company policies for website use, wholesale orders, shipping, cancellation,
            returns, cookies, quality standards, and export enquiries.
          </p>
          <div className="policy-company-card">
            <strong>{companyLegalDetails.legalName}</strong>
            <span>{companyLegalDetails.address}</span>
            <a href={`mailto:${companyLegalDetails.email}`}>{companyLegalDetails.email}</a>
            <span>Registered under GST and operating as a Micro Enterprise under the Udyam framework.</span>
          </div>
        </div>

        <div className="policy-layout">
          <aside className="policy-toc" aria-label="Policy navigation">
            <h2>Policy Index</h2>
            <nav>
              {policyLinks.map((policy) => (
                <a key={policy.slug} href={`#${policy.slug}`}>
                  {policy.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="policy-content">
            <div className="policy-summary-grid">
              {policyLinks.map((policy) => (
                <a key={policy.slug} className="policy-card" href={`#${policy.slug}`}>
                  <strong>{policy.title}</strong>
                  <small>Read website policy</small>
                </a>
              ))}
            </div>

            <p className="policy-source-note">
              These policies apply to website use, enquiries, quotations, orders, payments, delivery, support, and related business communications with FVP Purepick.
            </p>

            {policyLinks.map((policy) => (
              <article key={policy.slug} id={policy.slug} className="policy-section">
                <div className="policy-section-heading">
                  <div>
                    <h2>{policy.title}</h2>
                  </div>
                </div>

                <p>{policy.summary}</p>
                <ul className="policy-highlights">
                  {policy.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <div className="policy-full-text">
                  {(policyFullTexts[policy.slug] ?? "").split("\n").map((line, index) => {
                    const content = line.trim();
                    if (!content) {
                      return null;
                    }
                    if (isPolicyHeading(content)) {
                      return <h3 key={`${policy.slug}-${index}`}>{content}</h3>;
                    }
                    return <p key={`${policy.slug}-${index}`}>{content}</p>;
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
