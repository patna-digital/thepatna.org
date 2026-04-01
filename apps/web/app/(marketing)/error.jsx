"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MarketingError({ error, reset }) {
  useEffect(() => {
    console.error("Marketing page error:", error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <h1>Page unavailable</h1>
      <p style={{ color: "#6b7280" }}>
        {error?.message || "This page encountered an error. Please try again."}
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button onClick={reset} type="button">
          Try again
        </button>
        <Link href="/">Go home</Link>
      </div>
    </div>
  );
}
