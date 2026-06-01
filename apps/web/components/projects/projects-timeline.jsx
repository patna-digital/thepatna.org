// Two-column programme timeline. Accepts the journeyPhases array from
// patna-data.js so the editorial narrative stays in one place.

export function ProjectsTimeline({ phases = [] }) {
  if (!phases.length) return null;

  const mid = Math.ceil(phases.length / 2);
  const left = phases.slice(0, mid);
  const right = phases.slice(mid);

  return (
    <div className="projects-timeline-grid">
      <TimelineColumn phases={left} />
      <TimelineColumn phases={right} />
    </div>
  );
}

function TimelineColumn({ phases }) {
  return (
    <div className="projects-timeline-col">
      {phases.map((phase, i) => (
        <div className="projects-timeline-item" key={i}>
          <div className="projects-timeline-dot" />
          <div className="projects-timeline-content">
            <div className="projects-timeline-year">{phase.period}</div>
            <h4 className="projects-timeline-phase">{phase.phase} — {phase.title}</h4>
            <p className="projects-timeline-body">{phase.body}</p>
            {phase.highlights?.length > 0 && (
              <div className="projects-timeline-highlights">
                {phase.highlights.map((h, j) => (
                  <span className="status-chip chip-neutral" key={j} style={{ fontSize: "0.72rem" }}>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
