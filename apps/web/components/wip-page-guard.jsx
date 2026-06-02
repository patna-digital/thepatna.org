"use client";

import { usePathname } from "next/navigation";

export function WipPageGuard({ wipPages, children }) {
  const pathname = usePathname();

  if (wipPages.length > 0 && wipPages.includes(pathname)) {
    return <WipMessage />;
  }

  return children;
}

function WipMessage() {
  return (
    <main className="wip-page" aria-label="Page under construction">
      <div className="wip-page-inner">
        <div className="wip-page-badge" aria-hidden="true">
          <span className="wip-page-icon">🔧</span>
        </div>

        <div className="wip-page-eyebrow">Work in progress</div>

        <h1 className="wip-page-title">
          We&rsquo;re polishing this one.
        </h1>

        <p className="wip-page-body">
          This page is getting an upgrade. It will be back shortly — everything
          else on the site is fully available in the meantime.
        </p>

        <div className="wip-page-actions">
          <a className="primary-button" href="/">
            Back to Home
          </a>
          <a className="secondary-button" href="/about">
            About PATNA
          </a>
        </div>

        <p className="wip-page-contact">
          Got a time-sensitive question?{" "}
          <a href="mailto:contact@thepatna.org">contact@thepatna.org</a>
        </p>
      </div>
    </main>
  );
}
