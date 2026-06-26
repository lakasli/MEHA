import { useEffect, useRef, useState } from "react";
import "./BarChart.css";

export type BarChartMode = "grouped" | "stacked";

export interface BarChartSeries {
  /** Label shown in the legend and on the x-axis group. */
  label: string;
  /** For grouped: one value per category; for stacked: one value per segment. */
  values: number[];
  /** Marks MEHA — gets the terracotta accent. */
  isOurs?: boolean;
}

interface BarChartProps {
  mode: BarChartMode;
  /** X-axis category labels (e.g. distributions). */
  categories: string[];
  series: BarChartSeries[];
  /** Y-axis label, e.g. "Degradation (%)". */
  yLabel?: string;
  /** For stacked mode, the segment labels within each series. */
  segmentLabels?: string[];
  /** Unit suffix shown in tooltips. */
  unit?: string;
  /** Optional caption beneath the chart. */
  caption?: string;
}

interface HoverInfo {
  x: number;
  y: number;
  text: string;
}

const PADDING = { top: 24, right: 16, bottom: 56, left: 56 };

/** Editorial palette: terracotta for MEHA, sage for variants, ink shades for baselines. */
const PALETTE = {
  ours: "#b85c3c",
  oursSoft: "#d99a7d",
  ember: "#c2894a",
  sage: "#6b7f6e",
  ink: "#1f1b17",
  inkMuted: "#6b6258",
  inkFaint: "#a39a8c",
  rule: "#d8d1c3",
  ruleStrong: "#b9b0a0",
  canvas: "#f4f1ea",
  surface: "#faf7f1",
};

const STACK_COLORS = ["#b85c3c", "#c2894a", "#6b7f6e"]; // HeteAttn, Expert, TGate

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

export function BarChart({
  mode,
  categories,
  series,
  yLabel,
  segmentLabels,
  unit = "",
  caption,
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [size, setSize] = useState({ w: 800, h: 360 });

  // Track container size for responsive redraw.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: 360 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute geometry for hit testing (kept in ref for hover handler).
  const geomRef = useRef<
    Array<{
      cx: number;
      cyTop: number;
      cyBottom: number;
      w: number;
      label: string;
      value: number;
      segmentLabel?: string;
      isOurs?: boolean;
    }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = size.w;
    const H = size.h;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const plotW = W - PADDING.left - PADDING.right;
    const plotH = H - PADDING.top - PADDING.bottom;

    // Determine y-axis max.
    let yMax: number;
    if (mode === "grouped") {
      yMax = niceMax(Math.max(...series.flatMap((s) => s.values), 1));
    } else {
      yMax = niceMax(
        Math.max(
          ...categories.map((_, i) =>
            series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0),
          ),
          1,
        ),
      );
    }

    // ---- Draw axes ----
    ctx.strokeStyle = PALETTE.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top);
    ctx.lineTo(PADDING.left, PADDING.top + plotH);
    ctx.lineTo(PADDING.left + plotW, PADDING.top + plotH);
    ctx.stroke();

    // ---- Y-axis ticks ----
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = (yMax / ticks) * i;
      const y = PADDING.top + plotH - (v / yMax) * plotH;
      ctx.strokeStyle = PALETTE.rule;
      ctx.beginPath();
      ctx.moveTo(PADDING.left - 4, y);
      ctx.lineTo(PADDING.left, y);
      ctx.stroke();
      // Faint horizontal gridline
      ctx.strokeStyle = "rgba(216, 209, 195, 0.5)";
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = PALETTE.inkFaint;
      ctx.fillText(v.toFixed(0), PADDING.left - 8, y);
    }

    // Y-axis label
    if (yLabel) {
      ctx.save();
      ctx.translate(14, PADDING.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = '10px "Inter", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(yLabel.toUpperCase(), 0, 0);
      ctx.restore();
    }

    // ---- Bars ----
    const groupW = plotW / categories.length;
    const geometries: (typeof geomRef.current)[number][] = [];
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    if (mode === "grouped") {
      const innerPad = 8;
      const barW = (groupW - innerPad * 2) / series.length;
      categories.forEach((cat, ci) => {
        const groupX = PADDING.left + ci * groupW;
        series.forEach((s, si) => {
          const v = s.values[ci] ?? 0;
          const x = groupX + innerPad + si * barW;
          const h = (v / yMax) * plotH;
          const y = PADDING.top + plotH - h;
          ctx.fillStyle = s.isOurs ? PALETTE.ours : PALETTE.inkMuted;
          ctx.fillRect(x, y, barW - 2, h);
          geometries.push({
            cx: x + (barW - 2) / 2,
            cyTop: y,
            cyBottom: PADDING.top + plotH,
            w: barW - 2,
            label: `${s.label} · ${cat}`,
            value: v,
            isOurs: s.isOurs,
          });
        });
        // Category label
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillText(cat, groupX + groupW / 2, PADDING.top + plotH + 8);
      });
    } else {
      // stacked
      const innerPad = 12;
      const barW = groupW - innerPad * 2;
      categories.forEach((cat, ci) => {
        const x = PADDING.left + ci * groupW + innerPad;
        let accY = PADDING.top + plotH;
        series.forEach((s, si) => {
          const v = s.values[ci] ?? 0;
          const h = (v / yMax) * plotH;
          const y = accY - h;
          ctx.fillStyle = STACK_COLORS[si % STACK_COLORS.length];
          ctx.fillRect(x, y, barW, h);
          // Segment outline
          ctx.strokeStyle = PALETTE.surface;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, h - 1);
          geometries.push({
            cx: x + barW / 2,
            cyTop: y,
            cyBottom: accY,
            w: barW,
            label: `${cat} · ${s.label}`,
            value: v,
            segmentLabel: s.label,
          });
          accY = y;
        });
        // Category label
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillText(cat, PADDING.left + ci * groupW + groupW / 2, PADDING.top + plotH + 8);
      });
    }

    geomRef.current = geometries;
  }, [mode, categories, series, yLabel, size]);

  // Hover handling
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let nearest: (typeof geomRef.current)[number] | null = null;
    let bestDist = Infinity;
    for (const g of geomRef.current) {
      const dx = Math.abs(mx - g.cx);
      const dy = my - g.cyTop;
      if (dx < g.w / 2 + 4 && dy >= -4 && dy <= g.cyBottom - g.cyTop + 4) {
        const d = dx + Math.abs(dy);
        if (d < bestDist) {
          bestDist = d;
          nearest = g;
        }
      }
    }
    if (nearest) {
      setHover({
        x: nearest.cx,
        y: nearest.cyTop,
        text: `${nearest.label}\n${nearest.value.toFixed(1)}${unit}`,
      });
    } else {
      setHover(null);
    }
  };

  const handleLeave = () => setHover(null);

  return (
    <figure className="bar-chart">
      <div className="bar-chart__container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="bar-chart__canvas"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          role="img"
          aria-label={caption ?? `${mode} bar chart`}
        />
        {hover && (
          <div
            className="bar-chart__tooltip"
            style={{
              left: hover.x,
              top: Math.max(0, hover.y - 48),
            }}
          >
            {hover.text.split("\n").map((line, i) => (
              <span
                key={i}
                className={
                  i === 0
                    ? "bar-chart__tooltip-title"
                    : "bar-chart__tooltip-value numerals"
                }
              >
                {line}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <figcaption className="bar-chart__legend">
        {mode === "grouped"
          ? series.map((s) => (
              <span key={s.label} className="bar-chart__legend-item">
                <span
                  className="bar-chart__legend-swatch"
                  style={{
                    backgroundColor: s.isOurs ? PALETTE.ours : PALETTE.inkMuted,
                  }}
                />
                {s.label}
                {s.isOurs && <span className="bar-chart__legend-ours">★</span>}
              </span>
            ))
          : (segmentLabels ?? series.map((s) => s.label)).map((label, i) => (
              <span key={label} className="bar-chart__legend-item">
                <span
                  className="bar-chart__legend-swatch"
                  style={{ backgroundColor: STACK_COLORS[i % STACK_COLORS.length] }}
                />
                {label}
              </span>
            ))}
        {caption && <span className="bar-chart__caption">{caption}</span>}
      </figcaption>
    </figure>
  );
}
