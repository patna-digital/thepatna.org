"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MemberAppError({ error, reset }) {
  useEffect(() => {
    console.error("Member app error:", error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#6b7280" }}>
        {error?.message || "An unexpected error occurred loading this page."}
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button onClick={reset} type="button">
          Try again
        </button>
        <Link href="/app">Back to dashboard</Link>
      </div>
    </div>
  );
}
