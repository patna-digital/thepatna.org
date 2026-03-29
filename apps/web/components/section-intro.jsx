export function SectionIntro({ label, title, subtitle }) {
  return (
    <div className="stack">
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}
