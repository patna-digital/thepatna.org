"use client";

import { useEffect, useState } from "react";

export function HeroMediaCarousel({ section }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = section.items;
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <div className="hero-media-carousel">
      <div className="hero-media-frame">
        <img
          alt={activeSlide.alt}
          className="hero-media-image"
          loading="eager"
          src={activeSlide.src}
        />
        <div className="hero-media-overlay">
          <div className="tag">Official PATNA coverage</div>
          <strong>{activeSlide.title}</strong>
          <p>{activeSlide.body}</p>
          <div className="media-caption-row">
            <span>{activeSlide.caption}</span>
            <a href={activeSlide.sourceUrl} rel="noreferrer" target="_blank">
              Source
            </a>
          </div>
        </div>
      </div>

      <div className="hero-media-controls">
        <div className="hero-media-pills">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show ${slide.title}`}
              className={index === activeIndex ? "active" : undefined}
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {slide.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
