import { ImageResponse } from "next/og";
export const alt = "PalletNest — Plan smarter pallet loads";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f5f7f3",
        padding: 80,
        flexDirection: "column",
        justifyContent: "center",
        color: "#244c3b",
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 35 }}>PalletNest</div>
      <div style={{ fontSize: 76, fontWeight: 700, maxWidth: 950 }}>
        Plan smarter pallet loads.
      </div>
      <div style={{ fontSize: 29, marginTop: 35, color: "#647169" }}>
        Compare layouts. Plan quantities. Print instructions.
      </div>
    </div>,
    size,
  );
}
