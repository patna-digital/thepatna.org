export function MediaArticleCard({
  featured = false,
  label,
  media,
  meta = [],
  sourceLabel = "Open source coverage",
  summary,
  title,
}) {
  return (
    <article className={`media-article-card ${featured ? "featured" : ""}`}>
      <div className="media-article-visual">
        <img alt={media.alt} loading="lazy" src={media.src} />
      </div>

      <div className="media-article-body">
        {label ? <div className="tag">{label}</div> : null}
        <h3>{title}</h3>
        <p>{summary}</p>

        {meta.length ? (
          <div className="content-meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <div className="media-article-footer">
          <div className="media-credit">
            <span>{media.credit}</span>
            <span>{media.caption}</span>
          </div>
          <a className="text-link" href={media.sourceUrl} rel="noreferrer" target="_blank">
            {sourceLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
