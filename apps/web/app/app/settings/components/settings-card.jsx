"use client";

import { useState } from "react";

export function SettingsCard({ title, description, children }) {
  return (
    <article className="dashboard-card settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">{title}</h3>
        <p className="settings-card-description">{description}</p>
      </div>
      <div className="settings-card-content">
        {children}
      </div>
    </article>
  );
}
