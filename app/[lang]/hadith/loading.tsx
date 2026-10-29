import "./hadith.css";

export default function HadithIndexLoading() {
  return (
    <div className="page hadith-page" aria-busy="true" aria-live="polite">
      <header className="hadith-header">
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "240px",
            blockSize: "36px",
            marginInline: "auto",
            marginBlockEnd: "12px",
          }}
        />
        <div
          className="reader-skeleton-line"
          style={{
            inlineSize: "360px",
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
            blockSize: "52px",
            borderRadius: "var(--radius)",
          }}
        />
      </div>

      <div className="hadith-collections-grid">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="hadith-collection-card reader-skeleton-card"
            style={{ minBlockSize: "160px", padding: "28px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBlockEnd: "16px",
              }}
            >
              <div style={{ display: "grid", gap: "8px" }}>
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "180px", blockSize: "24px" }}
                />
                <div
                  className="reader-skeleton-line"
                  style={{ inlineSize: "130px", blockSize: "20px" }}
                />
              </div>
            </div>
            <div
              className="reader-skeleton-line"
              style={{
                inlineSize: "85%",
                blockSize: "16px",
                marginBlockEnd: "8px",
              }}
            />
            <div
              className="reader-skeleton-line"
              style={{ inlineSize: "60%", blockSize: "16px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

