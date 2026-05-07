import { ImageResponse } from "next/og";

export const runtime = "edge";

function getIconSize(request: Request) {
  const size = Number(new URL(request.url).searchParams.get("size"));
  if (size === 180 || size === 192 || size === 512) return size;
  return 512;
}

export function GET(request: Request) {
  const size = getIconSize(request);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(145deg, #07111f 0%, #0c2741 48%, #0fbfe8 100%)",
        borderRadius: Math.round(size * 0.22),
        color: "#eaffff",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: Math.round(size * 0.48),
        fontWeight: 900,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-0.06em",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.1)",
          border: `${Math.max(2, Math.round(size * 0.018))}px solid rgba(255,255,255,0.22)`,
          borderRadius: Math.round(size * 0.18),
          boxShadow: "0 18px 58px rgba(0,0,0,0.26)",
          display: "flex",
          height: "72%",
          justifyContent: "center",
          width: "72%",
        }}
      >
        T
      </div>
      <div
        style={{
          background: "#67e8f9",
          borderRadius: 999,
          height: "10%",
          position: "absolute",
          right: "19%",
          top: "18%",
          width: "10%",
        }}
      />
    </div>,
    {
      height: size,
      width: size,
    },
  );
}
