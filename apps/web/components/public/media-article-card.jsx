import Link from "next/link";

export function MediaArticleCard({
  featured = false,
  label,
  media,
  meta = [],
  sourceLabel = "Open source coverage",
  sourceUrl,
  summary,
  title,
}) {
  const href = sourceUrl || media.sourceUrl;
  const isInternal = typeof href === "string" && href.startsWith("/");

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
          {isInternal ? (
            <Link className="text-link" href={href}>
              {sourceLabel}
            </Link>
          ) : (
            <a className="text-link" href={href} rel="noreferrer" target="_blank">
              {sourceLabel}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
