"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function HeroContentSlider({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [items.length]);

  const slide = items[activeIndex];

  return (
    <div className="hero-content-slider">
      <div className="hero-content-slides">
        {items.map((item, index) => (
          <div
            className={`hero-content-slide${index === activeIndex ? " active" : ""}`}
            key={item.href}
          >
            {item.image && (
              <div className="hero-content-slide-image">
                <img alt={item.imageAlt || item.title} loading="eager" src={item.image} />
              </div>
            )}
            <div className="hero-content-slide-body">
              <span className="hero-content-slide-tag">{item.type}</span>
              <h3>{item.title}</h3>
              {item.meta && <p className="hero-content-slide-meta">{item.meta}</p>}
              <p className="hero-content-slide-summary">{item.summary}</p>
              <Link className="hero-content-slide-link" href={item.href}>
                Read more
              </Link>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="hero-content-slider-dots">
          {items.map((item, index) => (
            <button
              aria-label={`Show ${item.title}`}
              className={index === activeIndex ? "active" : undefined}
              key={item.href}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
