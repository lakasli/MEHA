/* Experiment domain types — derived from §1 of the experimental design doc. */

export type ExperimentKey =
  | "E1"
  | "E2"
  | "E3"
  | "E4"
  | "E5"
  | "E6"
  | "E7";

export type RunStatus = "idle" | "running" | "completed" | "stopped" | "error";

export interface RunStage {
  /** Stage key — used for icon/state lookups. */
  key: "connect" | "dispatch" | "collect" | "compute" | "done";
  /** One-line label shown next to the progress bar. */
  label: string;
  /** Brief description of what is happening on the wire. */
  detail: string;
}

export interface ParamItem {
  /** Parameter name, e.g. "num_agvs". */
  name: string;
  /** Value rendered in mono, e.g. "10" or "{5, 10, 15, 20, 30}". */
  value: string;
  /** Optional unit suffix, e.g. "m/s", "ms". */
  unit?: string;
  /** Short note shown under the value. */
  note?: string;
}

export interface Experiment {
  key: ExperimentKey;
  /** Short title, e.g. "Same-distribution benchmark". */
  title: string;
  /** Chinese subtitle from the doc, kept for parity with the source. */
  subtitle: string;
  /** Paper section reference, e.g. "§5.2.1". */
  section: string;
  /** The single question this experiment answers. */
  question: string;
  /** Expected outcome, stated as a single sentence. */
  expected: string;
  /** Which distribution(s) this experiment exercises. */
  distributions: string[];
  /** Parameter groups rendered in the config panel. */
  paramGroups: ParamGroup[];
  /** Run stages, in order. */
  stages: RunStage[];
}

export interface ParamGroup {
  /** Group label, e.g. "Map & topology", "AGV fleet". */
  label: string;
  items: ParamItem[];
}

export type PanelKey = "runner" | "monitor" | "results";
