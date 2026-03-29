export function VideoEmbedCard({ section }) {
  const item = section?.items?.[0];

  if (!item) {
    return null;
  }

  return (
    <section className="section">
      <div className="section-inner">
        <div className="video-embed-card">
          <div className="video-embed-copy">
            <div className="section-label">{section.label}</div>
            <h2 className="section-title">{section.title}</h2>
            {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
            <p className="muted-note">
              {item.licenseNote}
            </p>
          </div>

          <div className="video-embed-media">
            {item.embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                src={item.embedUrl}
                title={item.title || section.title}
              />
            ) : (
              <>
                <img alt={item.alt} loading="lazy" src={item.posterSrc || item.src} />
                <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                  Open source media
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
