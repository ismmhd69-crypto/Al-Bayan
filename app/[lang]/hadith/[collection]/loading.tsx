import "../hadith.css";

export default function HadithCollectionLoading() {
  return (
    <div className="hadith-page" aria-busy="true" aria-live="polite">
      <nav className="hadith-nav-top" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "140px", blockSize: "20px" }}
        />
      </nav>

      <header className="hadith-header">
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "260px",
            blockSize: "36px",
            marginInline: "auto",
            marginBlockEnd: "12px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "180px",
            blockSize: "24px",
            marginInline: "auto",
            marginBlockEnd: "12px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "420px",
            blockSize: "18px",
            marginInline: "auto",
          }}
        />
      </header>

      <div className="hadith-search-wrapper">
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "100%",
            blockSize: "48px",
            borderRadius: "var(--radius)",
            marginBlockEnd: "20px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "100%",
            blockSize: "40px",
            borderRadius: "var(--radius)",
          }}
        />
      </div>

      <div className="hadith-books-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="hadith-book-card reader-skeleton-card"
            style={{ minBlockSize: "72px" }}
          >
            <div className="hadith-book-leading">
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "28px", blockSize: "28px", borderRadius: "50%" }}
              />
            </div>
            <div className="hadith-book-body" style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "110px", blockSize: "16px" }}
                />
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "90px", blockSize: "16px" }}
                />
              </div>
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "70px", blockSize: "12px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

