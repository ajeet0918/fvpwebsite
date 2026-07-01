import { SectionTitle } from "../components/SectionTitle";

export function AboutPage() {
  return (
    <div className="page">
      <section className="panel">
        <SectionTitle
          eyebrow="About FVP Purepick"
          title="Wholesale agriculture supply built around clarity"
          description="FVP Purepick supports buyers with catalog browsing, MOQ-led quotes, delivery coordination, and practical support for agriculture supply requirements."
        />
        <div className="card narrative">
          <p>
            FVP Purepick is positioned as a wholesale agriculture supplier for vegetables, seeds,
            fertilizers, farm supplies, and food staples. Product grade, packaging, delivery area,
            and current rates should be confirmed before dispatch.
          </p>
        </div>
      </section>
    </div>
  );
}
