import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PostgreSQL Timeline";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(50,194,232,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,246,85,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            left: "-160px",
            width: "384px",
            height: "384px",
            background: "#32c2e8",
            opacity: 0.1,
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            right: "-160px",
            width: "384px",
            height: "384px",
            background: "#63f655",
            opacity: 0.1,
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              marginBottom: "24px",
              lineHeight: 1.2,
              background: "linear-gradient(to right, #32c2e8, #63f655)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            PostgreSQL Timeline
          </h1>
          <p
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.4,
              marginBottom: "40px",
            }}
          >
            Explore the history of PostgreSQL
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: 24,
                color: "rgba(255, 255, 255, 0.5)",
                marginBottom: "4px",
              }}
            >
              Presented by
            </p>
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_URL}/neon-logo-dark-color.svg`}
              alt="Neon Logo"
              style={{
                width: "160px",
                height: "32px",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 