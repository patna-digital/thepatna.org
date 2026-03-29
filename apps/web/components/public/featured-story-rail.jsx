"use client";

import { useState } from "react";
import { SectionIntro } from "@/components/section-intro";

export function FeaturedStoryRail({ section }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = section.items[activeIndex];

  return (
    <section className="section">
      <div className="section-inner">
        <SectionIntro
          label={section.label}
          subtitle={section.subtitle}
          title={section.title}
        />

        <div className="story-rail">
          <div className="story-rail-tabs">
            {section.items.map((item, index) => (
              <button
                className={index === activeIndex ? "active" : undefined}
                key={item.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                {item.title}
              </button>
            ))}
          </div>

          <article className="story-rail-panel">
            <div className="story-rail-media">
              <img alt={activeItem.alt} loading="lazy" src={activeItem.src} />
            </div>

            <div className="story-rail-copy">
              <div className="tag">Official PATNA source</div>
              <h3>{activeItem.title}</h3>
              <p>{activeItem.body}</p>
              <div className="media-credit">
                <span>{activeItem.caption}</span>
                <span>{activeItem.credit}</span>
              </div>
              <a className="text-link" href={activeItem.sourceUrl} rel="noreferrer" target="_blank">
                Open source coverage
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
