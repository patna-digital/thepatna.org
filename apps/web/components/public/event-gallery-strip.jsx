"use client";

import { useMemo, useState } from "react";
import { SectionIntro } from "@/components/section-intro";

export function EventGalleryStrip({ section }) {
  const [startIndex, setStartIndex] = useState(0);
  const items = section.items;
  const visibleItems = useMemo(() => {
    return [0, 1, 2].map((offset) => items[(startIndex + offset) % items.length]);
  }, [items, startIndex]);

  return (
    <section className="section">
      <div className="section-inner">
        <div className="gallery-strip-header">
          <SectionIntro
            label={section.label}
            subtitle={section.subtitle}
            title={section.title}
          />
          <div className="gallery-strip-controls">
            <button
              aria-label="Show previous event images"
              onClick={() => setStartIndex((current) => (current - 1 + items.length) % items.length)}
              type="button"
            >
              Prev
            </button>
            <button
              aria-label="Show next event images"
              onClick={() => setStartIndex((current) => (current + 1) % items.length)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>

        <div className="gallery-strip-grid">
          {visibleItems.map((item) => (
            <article className="gallery-strip-card" key={item.id}>
              <div className="gallery-strip-media">
                <img alt={item.alt} loading="lazy" src={item.src} />
              </div>
              <div className="gallery-strip-copy">
                <strong>{item.caption}</strong>
                <p>{item.licenseNote}</p>
                <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                  Source
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
