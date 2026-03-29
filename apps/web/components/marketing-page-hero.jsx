import Link from "next/link";

function getActionClassName(variant) {
  if (variant === "secondary") {
    return "secondary-button";
  }

  if (variant === "text") {
    return "text-link";
  }

  return "primary-button";
}

export function MarketingPageHero({ label, title, subtitle, actions = [] }) {
  return (
    <section className="page-hero">
      <div className="section-inner">
        <div className="page-hero-panel">
          <div className="section-label">{label}</div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {actions.length ? (
            <div className="hero-actions">
              {actions.map((action) => (
                <Link
                  className={getActionClassName(action.variant)}
                  href={action.href}
                  key={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
