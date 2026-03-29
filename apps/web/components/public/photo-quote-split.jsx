import { SectionIntro } from "@/components/section-intro";

export function PhotoQuoteSplit({ section }) {
  const media = section.asset;

  return (
    <section className="section">
      <div className="section-inner">
        <div className={`photo-quote-split ${section.reverse ? "reverse" : ""}`}>
          <div className="photo-quote-media">
            <img alt={media.alt} loading="lazy" src={media.src} />
            <div className="media-caption-card">
              <strong>{media.credit}</strong>
              <span>{media.caption}</span>
              <a href={media.sourceUrl} rel="noreferrer" target="_blank">
                Open source
              </a>
            </div>
          </div>

          <div className="photo-quote-copy">
            <SectionIntro
              label={section.label}
              subtitle={section.subtitle}
              title={section.title}
            />
            <blockquote>{section.quote}</blockquote>
            <p>{section.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
