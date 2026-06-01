"use client";

import Link from "next/link";

export default function AppError({ error, reset }) {
  return (
    <div style={{ padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#6b7280" }}>
        {error?.message || "An unexpected error occurred."}
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
