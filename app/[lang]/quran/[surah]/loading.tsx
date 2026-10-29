import "../quran.css";

export default function SurahLoading() {
  return (
    <div className="page quran-reader-page" aria-busy="true" aria-live="polite">
      {/* Top breadcrumb */}
      <nav className="quran-nav-top" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "120px", blockSize: "20px" }}
        />
      </nav>

      {/* Surah banner */}
      <header
        className="surah-hero reader-skeleton-card"
        style={{
          padding: "32px 24px",
          marginBlockEnd: "32px",
          display: "grid",
          placeItems: "center",
          gap: "12px",
        }}
      >
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "180px", blockSize: "32px" }}
        />
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "120px", blockSize: "24px" }}
        />
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "160px", blockSize: "16px" }}
        />
      </header>

      {/* Verse cards */}
      <div className="quran-verses-list" style={{ display: "grid", gap: "20px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="quran-verse-card reader-skeleton-card"
            style={{ padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBlockEnd: "20px",
              }}
            >
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "40px", blockSize: "24px", borderRadius: "4px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "60px", blockSize: "24px", borderRadius: "4px" }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginBlockEnd: "20px",
                justifyItems: "end",
              }}
            >
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "95%", blockSize: "24px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "75%", blockSize: "24px" }}
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "90%", blockSize: "16px" }}
              />
              <div
                className="reader-skeleton-line"
                style={{ inlineSize: "60%", blockSize: "16px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

