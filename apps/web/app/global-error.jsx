"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", maxWidth: "40rem", margin: "4rem auto" }}>
          <h1>Something went wrong</h1>
          <p style={{ color: "#6b7280" }}>
            {error?.message || "A critical error occurred. Please reload the page."}
          </p>
          <button onClick={reset} style={{ marginTop: "1rem" }} type="button">
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
