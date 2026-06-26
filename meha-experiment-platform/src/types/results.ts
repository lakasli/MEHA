/* Result types — one per experiment tab shown in the Results panel. */

/* ---- E1: same-distribution benchmark table ---- */
export interface E1Row {
  method: string;
  /** Total Distance (m), lower is better. */
  td: number | null;
  /** seconds, lower is better. */
  makespan: number | null;
  /** Ah, lower is better. */
  energy: number | null;
  /** integer count, lower is better. */
  collisions: number | null;
  /** Gap to POMO as a signed percentage. NaN for POMO itself. */
  gapToPomo: number | null;
  /** True when this row is our method (MEHA). */
  isOurs?: boolean;
}

/* ---- E2: cross-distribution degradation ---- */
export type MethodKey =
  | "fcfs"
  | "am"
  | "pomo"
  | "amMultidist"
  | "pomoMultidist"
  | "meha";

export interface MethodLabel {
  key: MethodKey;
  label: string;
  isOurs?: boolean;
}

export interface DegradationPoint {
  distribution: string;
  /** Per-method degradation rate (%), lower is better. */
  values: Record<MethodKey, number>;
}

/* ---- E4: ablation stacked bars ---- */
export type AblationVariant =
  | "withoutHeteAttn"
  | "withoutExpert"
  | "withoutTGate";

export interface AblationComponent {
  key: AblationVariant;
  label: string;
  /** Per-distribution degradation delta relative to Full MEHA. */
  values: Record<string, number>;
}

/* ---- E6: expert gating heatmap ---- */
export interface GatingMatrix {
  /** Expert labels in row order, e.g. ["E₁", "E₂", …]. */
  experts: string[];
  /** Distribution labels in column order. */
  distributions: string[];
  /** weights[row][col] in [0, 1]. */
  weights: number[][];
}

/* ---- E7: inference timing table ---- */
export interface E7Row {
  method: string;
  /** ms on small instance (15 stations, 10 AGV, 50 orders). */
  small: number;
  /** ms on medium instance (30 stations, 20 AGV, 150 orders). */
  medium: number;
  /** ms on large instance (80 stations, 30 AGV, 300 orders). */
  large: number;
  isOurs?: boolean;
}
