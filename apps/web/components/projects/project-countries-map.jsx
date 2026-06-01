// Renders a navy-background grid of unique country pills grouped by phase label.
// countries is an array of { country, phase_label, sort_order } from project_countries.

export function ProjectCountriesMap({
  countries = [],
  title = "Countries engaged across the LEAP programme",
  subtitle,
}) {
  if (!countries.length) return null;

  const countriesByName = new Map();

  for (const c of countries) {
    const key = c.country;
    if (!countriesByName.has(key)) {
      countriesByName.set(key, {
        country: c.country,
        sort_order: c.sort_order ?? 0,
        phase_labels: new Set(),
      });
    }

    const current = countriesByName.get(key);
    current.sort_order = Math.min(current.sort_order, c.sort_order ?? current.sort_order);
    if (c.phase_label) current.phase_labels.add(c.phase_label);
  }

  const normalizedCountries = Array.from(countriesByName.values())
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((country) => ({
      ...country,
      phase_label: Array.from(country.phase_labels).join(" & "),
    }));

  const phaseLabels = Array.from(
    new Set(
      normalizedCountries
        .flatMap((country) => country.phase_label.split(" & ").filter(Boolean))
        .filter(Boolean)
    )
  );

  return (
    <div className="projects-countries-section">
      <h3 className="projects-countries-title">{title}</h3>
      <p className="projects-countries-subtitle">
        {subtitle || phaseLabels.join(" · ")}
      </p>
      <div className="projects-countries-grid">
        {normalizedCountries.map((c, i) => (
            <div className="projects-country-pill" key={i}>
              <span
                className="projects-country-dot"
                style={{
                  background: c.phase_label?.includes("II") || c.phase_label?.includes("III")
                    ? "#7fc4e8"
                    : "#b9e8fa",
                }}
              />
              <span>{c.country}</span>
              {c.phase_label ? (
                <span className="projects-country-phase">{c.phase_label}</span>
              ) : null}
            </div>
        ))}
      </div>
    </div>
  );
}
