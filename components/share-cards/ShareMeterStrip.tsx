import type { ShareCardFormat } from "@/lib/share-image";
import type { ShareMeterCell } from "@/lib/share-card-copy";

type Props = {
  cells: ShareMeterCell[];
  kicker: string;
  format: ShareCardFormat;
};

export function ShareMeterStrip({ cells, kicker, format }: Props) {
  if (cells.length === 0) return null;

  const compact = format === "square";

  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: compact ? 12 : 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        {kicker}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: compact ? 16 : 24,
          marginTop: compact ? 14 : 16,
          paddingTop: compact ? 14 : 16,
          borderTop: "1px solid rgba(245,240,232,0.18)",
        }}
      >
        {cells.map((cell) => (
          <div key={cell.label} style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: compact ? 11 : 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {cell.label}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: "var(--font-dm-serif), serif",
                fontSize: compact ? 26 : 30,
                lineHeight: 1,
                color: "#F5F0E8",
              }}
            >
              {cell.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
