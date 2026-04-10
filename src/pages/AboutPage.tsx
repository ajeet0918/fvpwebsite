import { SectionTitle } from "../components/SectionTitle";

export function AboutPage() {
  return (
    <div className="page">
      <section className="panel">
        <SectionTitle
          eyebrow="About The Brand"
          title="A wholesale agriculture identity built for trust and scale"
          description="This starter positions the business as a procurement partner for farmers, distributors, and retailers instead of a generic catalog website."
        />
        <div className="card narrative">
          <p>
            Verdant Harvest Supply is framed as a B2B agriculture brand focused on quality sourcing,
            strong supply relationships, and responsive bulk-order support. The backend is structured
            so content can evolve into a managed product and inquiry system.
          </p>
        </div>
      </section>
    </div>
  );
}
