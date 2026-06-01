"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <h1>Admin error</h1>
      <p style={{ color: "#6b7280" }}>
        {error?.message || "An unexpected error occurred in the admin area."}
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button onClick={reset} type="button">
          Try again
        </button>
        <Link href="/admin">Back to admin</Link>
      </div>
    </div>
  );
}
