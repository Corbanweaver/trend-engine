import { ImageResponse } from "next/og";

export const alt = "Content Buddy - AI content ideas from live trend signals";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "edge";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #7c3aed 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: 72,
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
          <div
            style={{
              alignItems: "center",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 28,
              display: "flex",
              fontSize: 44,
              fontWeight: 900,
              height: 86,
              justifyContent: "center",
              width: 86,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>Content Buddy</div>
            <div style={{ color: "#bae6fd", fontSize: 22 }}>
              Trend intelligence for creators
            </div>
          </div>
        </div>
        <div
          style={{
            background: "rgba(103,232,249,0.16)",
            border: "1px solid rgba(103,232,249,0.42)",
            borderRadius: 999,
            color: "#cffafe",
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            padding: "12px 22px",
          }}
        >
          Live signals + AI briefs
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 0.98,
            maxWidth: 900,
          }}
        >
          Turn live trends into content you can publish.
        </div>
        <div
          style={{
            color: "#dbeafe",
            display: "flex",
            fontSize: 30,
            lineHeight: 1.25,
            maxWidth: 880,
          }}
        >
          Generate hooks, scripts, hashtags, source links, and polished idea
          cards from one creator workflow.
        </div>
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        {[
          "Stripe-secured billing",
          "Source links included",
          "Cancel anytime",
        ].map((item) => (
          <div
            key={item}
            style={{
              background: "rgba(15,23,42,0.38)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 18,
              color: "#e0f2fe",
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              padding: "14px 18px",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
