// Renders a navy-background grid of country pills, grouped by phase_label.
// countries is an array of { country, phase_label, sort_order } from project_countries.

export function ProjectCountriesMap({ countries = [] }) {
  if (!countries.length) return null;

  // Group by phase_label; preserve insertion order.
  const byPhase = new Map();
  for (const c of countries) {
    const key = c.phase_label || "Engaged";
    if (!byPhase.has(key)) byPhase.set(key, []);
    byPhase.get(key).push(c);
  }

  const phases = Array.from(byPhase.entries());

  return (
    <div className="projects-countries-section">
      <h3 className="projects-countries-title">Countries engaged across the LEAP programme</h3>
      <p className="projects-countries-subtitle">
        {phases.map(([label]) => label).join(" · ")}
      </p>
      <div className="projects-countries-grid">
        {countries
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((c, i) => (
            <div className="projects-country-pill" key={i}>
              <span
                className="projects-country-dot"
                style={{
                  background: c.phase_label?.includes("II") ? "#7fc4e8" : "#b9e8fa",
                }}
              />
              {c.country}
            </div>
          ))}
      </div>
    </div>
  );
}
