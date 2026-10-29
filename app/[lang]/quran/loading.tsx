import "./quran.css";

export default function QuranLoading() {
  return (
    <div className="page quran-page" aria-busy="true" aria-live="polite">
      <header className="page-head">
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "220px", blockSize: "36px", marginBlockEnd: "12px" }}
        />
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "360px", blockSize: "18px" }}
        />
      </header>

      <div className="quran-search-wrapper">
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "100%", blockSize: "48px", borderRadius: "var(--radius)" }}
        />
      </div>

      <div className="quran-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="quran-card reader-skeleton-card"
            style={{ minBlockSize: "72px" }}
          >
            <div className="quran-card-leading">
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "28px", blockSize: "28px", borderRadius: "50%" }}
              />
            </div>
            <div className="quran-card-body" style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "90px", blockSize: "16px" }}
                />
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "70px", blockSize: "16px" }}
                />
              </div>
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "120px", blockSize: "12px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

