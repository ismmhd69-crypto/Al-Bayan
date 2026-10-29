import "../../../hadith.css";

export default function HadithBookLoading() {
  return (
    <div className="hadith-page hadith-book-view" aria-busy="true" aria-live="polite">
      <nav className="hadith-nav-top" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "180px", blockSize: "20px" }}
        />
      </nav>

      <header className="hadith-header">
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "280px",
            blockSize: "32px",
            marginInline: "auto",
            marginBlockEnd: "8px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "200px",
            blockSize: "22px",
            marginInline: "auto",
            marginBlockEnd: "8px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "120px",
            blockSize: "14px",
            marginInline: "auto",
          }}
        />
      </header>

      <div style={{ display: "grid", gap: "20px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="hadith-single-card reader-skeleton-card"
            style={{ padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBlockEnd: "16px",
              }}
            >
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "90px", blockSize: "24px", borderRadius: "4px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "70px", blockSize: "24px", borderRadius: "4px" }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gap: "10px",
                marginBlockEnd: "20px",
                justifyItems: "end",
              }}
            >
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "100%", blockSize: "22px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "80%", blockSize: "22px" }}
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "90%", blockSize: "16px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "65%", blockSize: "16px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

