import { useState } from "react";
import type { GatingMatrix } from "@/types/results";
import "./Heatmap.css";

interface HeatmapProps {
  matrix: GatingMatrix;
  /** Optional role label per expert row (e.g. "Generalist"). */
  expertRoles?: string[];
  caption?: string;
}

interface HoverCell {
  row: number;
  col: number;
  x: number;
  y: number;
}

/** Map a weight in [0, 1] to an editorial warm fill. */
function weightColor(w: number): string {
  // Lerp cream → terracotta. Above 0.5 starts tinting strongly.
  const t = Math.max(0, Math.min(1, w));
  // Use HSL interpolation from sage to terracotta for variety.
  // Sage #6b7f6e → hsl(127, 8%, 46%); terracotta #b85c3c → hsl(13, 50%, 48%)
  const hue = 127 + (13 - 127) * t;
  const sat = 8 + (50 - 8) * t;
  const light = 70 - 30 * t; // darker for higher weights
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function textColor(w: number): string {
  return w > 0.35 ? "#fdfaf3" : "#1f1b17";
}

export function Heatmap({ matrix, expertRoles, caption }: HeatmapProps) {
  const [hover, setHover] = useState<HoverCell | null>(null);
  const { experts, distributions, weights } = matrix;

  return (
    <figure className="heatmap">
      <div className="heatmap__grid-wrap">
        <table className="heatmap__table">
          <thead>
            <tr>
              <th className="heatmap__corner" aria-label="专家 vs 分布" />
              {distributions.map((d) => (
                <th key={d} scope="col" className="heatmap__col-head">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experts.map((expert, ri) => (
              <tr key={expert}>
                <th scope="row" className="heatmap__row-head">
                  <span className="heatmap__row-label">{expert}</span>
                  {expertRoles && expertRoles[ri] && (
                    <span className="heatmap__row-role">{expertRoles[ri]}</span>
                  )}
                </th>
                {distributions.map((d, ci) => {
                  const w = weights[ri]?.[ci] ?? 0;
                  const isHover = hover && hover.row === ri && hover.col === ci;
                  return (
                    <td
                      key={d}
                      className={[
                        "heatmap__cell",
                        isHover ? "heatmap__cell--hover" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        backgroundColor: weightColor(w),
                        color: textColor(w),
                      }}
                      onMouseEnter={(e) =>
                        setHover({
                          row: ri,
                          col: ci,
                          x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2,
                          y: e.currentTarget.offsetTop,
                        })
                      }
                      onMouseLeave={() => setHover(null)}
                    >
                      <span className="heatmap__cell-value numerals">
                        {w.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {hover && (
          <div
            className="heatmap__tooltip"
            style={{
              left: hover.x,
              top: hover.y - 8,
            }}
          >
            <span className="heatmap__tooltip-title">
              {experts[hover.row]} · {distributions[hover.col]}
            </span>
            <span className="heatmap__tooltip-value numerals">
              weight {(weights[hover.row]?.[hover.col] ?? 0).toFixed(3)}
            </span>
          </div>
        )}
      </div>

      {/* Color scale legend */}
      <div className="heatmap__scale">
        <span className="heatmap__scale-label">0.00</span>
        <span
          className="heatmap__scale-bar"
          style={{
            background: `linear-gradient(to right, ${weightColor(0)}, ${weightColor(0.3)}, ${weightColor(0.6)}, ${weightColor(1)})`,
          }}
        />
        <span className="heatmap__scale-label">1.00</span>
        <span className="heatmap__scale-detail">门控权重 · 颜色越深 = 路由越强</span>
      </div>

      {caption && <figcaption className="heatmap__caption">{caption}</figcaption>}
    </figure>
  );
}
