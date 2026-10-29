import "../../hadith.css";

export default function HadithSingleLoading() {
  return (
    <div className="hadith-page hadith-single-reader" aria-busy="true" aria-live="polite">
      <nav className="hadith-nav-top" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "200px", blockSize: "20px" }}
        />
      </nav>

      <article className="hadith-single-card reader-skeleton-card" style={{ padding: "28px" }}>
        <header
          className="hadith-card-head"
          style={{
            marginBlockEnd: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "140px", blockSize: "28px", borderRadius: "4px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "70px", blockSize: "28px", borderRadius: "4px" }}
          />
        </header>

        <div
          style={{
            marginBlockEnd: "20px",
            padding: "12px 14px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
          }}
        >
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "180px", blockSize: "16px", marginBlockEnd: "6px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "120px", blockSize: "14px" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginBlockEnd: "24px",
            justifyItems: "end",
          }}
        >
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "100%", blockSize: "26px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "85%", blockSize: "26px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "60%", blockSize: "26px" }}
          />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "95%", blockSize: "18px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "80%", blockSize: "18px" }}
          />
          <div
            className="reader-skeleton-line"
            style={{ inlineSize: "50%", blockSize: "18px" }}
          />
        </div>
      </article>

      <nav
        className="hadith-pagination"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBlockStart: "24px",
        }}
      >
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "120px", blockSize: "40px", borderRadius: "var(--radius)" }}
        />
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "140px", blockSize: "40px", borderRadius: "var(--radius)" }}
        />
        <div
          className="reader-skeleton-line"
          style={{ inlineSize: "120px", blockSize: "40px", borderRadius: "var(--radius)" }}
        />
      </nav>
    </div>
  );
}

