import type { E1Row } from "@/types/results";
import "./DataTable.css";

interface DataTableProps {
  rows: E1Row[];
  caption?: string;
}

interface ColumnSpec {
  key: keyof E1Row | "method";
  label: string;
  unit?: string;
  format: (row: E1Row) => string;
  /** Lower-is-better numeric field used to find the best value. */
  numericKey?: keyof E1Row;
  /** Force "ours" treatment. */
  isOursKey?: boolean;
}

const COLUMNS: ColumnSpec[] = [
  {
    key: "method",
    label: "方法",
    format: (r) => r.method,
  },
  {
    key: "td",
    label: "行驶距离",
    unit: "m",
    format: (r) => (r.td === null ? "—" : r.td.toLocaleString()),
    numericKey: "td",
  },
  {
    key: "makespan",
    label: "完工时间",
    unit: "s",
    format: (r) => (r.makespan === null ? "—" : r.makespan.toLocaleString()),
    numericKey: "makespan",
  },
  {
    key: "energy",
    label: "能耗",
    unit: "Ah",
    format: (r) => (r.energy === null ? "—" : r.energy.toLocaleString()),
    numericKey: "energy",
  },
  {
    key: "collisions",
    label: "碰撞次数",
    unit: "次",
    format: (r) => (r.collisions === null ? "—" : r.collisions.toLocaleString()),
    numericKey: "collisions",
  },
  {
    key: "gapToPomo",
    label: "Gap vs POMO",
    unit: "%",
    format: (r) =>
      r.gapToPomo === null || Number.isNaN(r.gapToPomo)
        ? "—"
        : `${r.gapToPomo > 0 ? "+" : ""}${r.gapToPomo.toFixed(1)}`,
  },
];

/** Find the best (minimum) value in a numeric column, ignoring nulls. */
function findBest(rows: E1Row[], key: keyof E1Row): number | null {
  let best: number | null = null;
  for (const r of rows) {
    const v = r[key];
    if (typeof v !== "number" || Number.isNaN(v)) continue;
    if (best === null || v < best) best = v;
  }
  return best;
}

export function DataTable({ rows, caption }: DataTableProps) {
  const bests: Record<string, number | null> = {};
  for (const c of COLUMNS) {
    if (c.numericKey) bests[c.numericKey as string] = findBest(rows, c.numericKey!);
  }

  return (
    <figure className="data-table">
      {caption && <figcaption className="data-table__caption">{caption}</figcaption>}
      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key as string} scope="col">
                  <span className="data-table__col-label">{c.label}</span>
                  {c.unit && <span className="data-table__col-unit">{c.unit}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOurs = r.isOurs === true;
              return (
                <tr
                  key={r.method}
                  className={isOurs ? "data-table__row--ours" : ""}
                >
                  {COLUMNS.map((c) => {
                    const value = c.format(r);
                    let isBest = false;
                    if (c.numericKey) {
                      const v = r[c.numericKey];
                      const b = bests[c.numericKey as string];
                      if (typeof v === "number" && b !== null && v === b) {
                        isBest = true;
                      }
                    }
                    const isMethod = c.key === "method";
                    return (
                      <td
                        key={c.key as string}
                        className={[
                          isMethod ? "data-table__cell--method" : "",
                          isBest ? "data-table__cell--best" : "",
                          isMethod && isOurs ? "data-table__cell--ours" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {isMethod && isOurs && (
                          <span className="data-table__ours-mark" aria-hidden>
                            ★
                          </span>
                        )}
                        <span className={isMethod ? "" : "numerals"}>{value}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="data-table__legend">
        <span className="data-table__legend-item">
          <span className="data-table__legend-mark data-table__legend-mark--best">●</span>
          列最优
        </span>
        <span className="data-table__legend-item">
          <span className="data-table__legend-mark data-table__legend-mark--ours">★</span>
          MEHA（我们的）
        </span>
        <span className="data-table__legend-item">
          所有指标均为越低越好。
        </span>
      </p>
    </figure>
  );
}
