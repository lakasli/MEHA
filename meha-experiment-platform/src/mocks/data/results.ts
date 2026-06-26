import type {
  E1Row, E7Row,
  MethodLabel, DegradationPoint,
  AblationComponent, GatingMatrix,
} from "@/types/results";

/* ---- E1: same-distribution benchmark ---- */
export const e1Rows: E1Row[] = [
  { method: "FCFS",          td: 18420, makespan: 612, energy: 421, collisions: 7, gapToPomo: +18.4 },
  { method: "Nearest-First", td: 16240, makespan: 548, energy: 372, collisions: 5, gapToPomo: +9.2 },
  { method: "AM",            td: 15210, makespan: 514, energy: 351, collisions: 2, gapToPomo: +3.1 },
  { method: "POMO",          td: 14880, makespan: 502, energy: 344, collisions: 2, gapToPomo: 0 },
  { method: "AM-MultiDist",  td: 14930, makespan: 504, energy: 345, collisions: 2, gapToPomo: +0.4 },
  { method: "POMO-MultiDist",td: 14910, makespan: 503, energy: 345, collisions: 2, gapToPomo: +0.2 },
  { method: "MEHA (Ours)",   td: 14860, makespan: 501, energy: 343, collisions: 0, gapToPomo: -0.1, isOurs: true },
];

/* ---- E2: cross-distribution degradation ---- */
export const methodLabels: MethodLabel[] = [
  { key: "fcfs",         label: "FCFS" },
  { key: "am",           label: "AM" },
  { key: "pomo",         label: "POMO" },
  { key: "amMultidist",  label: "AM-MultiDist" },
  { key: "pomoMultidist",label: "POMO-MultiDist" },
  { key: "meha",         label: "MEHA", isOurs: true },
];

export const degradationPoints: DegradationPoint[] = [
  { distribution: "D_test2",  values: { fcfs: 24.1, am: 14.3, pomo: 12.8, amMultidist: 8.4, pomoMultidist: 7.9, meha: 3.6 } },
  { distribution: "D_test3",  values: { fcfs: 11.2, am: 6.8,  pomo: 6.2,  amMultidist: 4.1, pomoMultidist: 3.8, meha: 1.7 } },
  { distribution: "D_test4",  values: { fcfs: 28.7, am: 18.1, pomo: 16.4, amMultidist: 11.2, pomoMultidist: 10.6, meha: 4.2 } },
  { distribution: "D_test5a", values: { fcfs: 22.4, am: 13.6, pomo: 12.1, amMultidist: 8.0, pomoMultidist: 7.5, meha: 3.3 } },
  { distribution: "D_test5b", values: { fcfs: 31.2, am: 20.4, pomo: 18.7, amMultidist: 12.6, pomoMultidist: 11.9, meha: 5.1 } },
  { distribution: "D_test6a", values: { fcfs: 14.8, am: 9.1,  pomo: 8.3,  amMultidist: 5.5, pomoMultidist: 5.1, meha: 2.3 } },
  { distribution: "D_test6b", values: { fcfs: 26.3, am: 16.8, pomo: 15.2, amMultidist: 10.4, pomoMultidist: 9.8, meha: 4.0 } },
  { distribution: "D_test7b", values: { fcfs: 38.6, am: 25.7, pomo: 23.1, amMultidist: 15.8, pomoMultidist: 14.7, meha: 5.9 } },
  { distribution: "D_test8b", values: { fcfs: 34.1, am: 22.3, pomo: 20.4, amMultidist: 13.9, pomoMultidist: 13.1, meha: 5.4 } },
  { distribution: "D_test9b", values: { fcfs: 21.6, am: 13.8, pomo: 12.6, amMultidist: 8.3, pomoMultidist: 7.8, meha: 3.1 } },
];

/* ---- E4: ablation stacked bars ---- */
export const ablationDistributions = ["D_train", "D_test2", "D_test4", "D_test7b", "D_test8b", "D_test9b"];

export const ablationComponents: AblationComponent[] = [
  {
    key: "withoutHeteAttn",
    label: "w/o HeteAttn",
    values: {
      "D_train": 0.8, "D_test2": 1.4, "D_test4": 5.2,
      "D_test7b": 1.1, "D_test8b": 0.9, "D_test9b": 1.0,
    },
  },
  {
    key: "withoutExpert",
    label: "w/o Expert",
    values: {
      "D_train": 2.1, "D_test2": 6.8, "D_test4": 5.9,
      "D_test7b": 7.4, "D_test8b": 6.3, "D_test9b": 5.7,
    },
  },
  {
    key: "withoutTGate",
    label: "w/o TGate",
    values: {
      "D_train": 1.3, "D_test2": 3.2, "D_test4": 2.7,
      "D_test7b": 3.8, "D_test8b": 3.4, "D_test9b": 3.1,
    },
  },
];

/* ---- E6: gating heatmap (K=6 experts × 6 distributions) ---- */
export const gatingMatrix: GatingMatrix = {
  experts: ["E₁", "E₂", "E₃", "E₄", "E₅", "E₆"],
  distributions: ["D_train", "D_test2", "D_test4", "D_test7b", "D_test8b", "D_test9b"],
  weights: [
    // D_train  D_test2  D_test4  D_test7b  D_test8b  D_test9b
    [  0.42,    0.08,    0.06,    0.05,     0.07,     0.06 ], // E₁ — generalist
    [  0.18,    0.51,    0.10,    0.09,     0.11,     0.14 ], // E₂ — high-density
    [  0.14,    0.18,    0.55,    0.10,     0.12,     0.09 ], // E₃ — hetero-AGV
    [  0.10,    0.09,    0.13,    0.58,     0.18,     0.12 ], // E₄ — strict-safety
    [  0.09,    0.08,    0.10,    0.12,     0.45,     0.10 ], // E₅ — low-battery
    [  0.07,    0.06,    0.06,    0.06,     0.07,     0.49 ], // E₆ — real-time
  ],
};

export const gatingExpertRoles: string[] = [
  "通才",
  "高密度调度器",
  "异质 AGV 适配器",
  "严格安全专家",
  "低电量调度器",
  "实时优先级",
];

/* ---- E7: inference timing ---- */
export const e7Rows: E7Row[] = [
  { method: "FCFS",            small: 1,  medium: 1,  large: 2 },
  { method: "Nearest-First",   small: 5,  medium: 20, large: 80 },
  { method: "AM",              small: 5,  medium: 15, large: 40 },
  { method: "POMO",            small: 8,  medium: 20, large: 55 },
  { method: "AM-MultiDist",    small: 6,  medium: 16, large: 42 },
  { method: "POMO-MultiDist",  small: 9,  medium: 22, large: 58 },
  { method: "MEHA (Ours)",     small: 15, medium: 35, large: 80, isOurs: true },
];

export const e7Breakdown = [
  { component: "HeteAttn",     overhead: 2,  simagv: "AGV 能力编码（尺寸/速度）" },
  { component: "TGate",        overhead: 1,  simagv: "约束上下文路由" },
  { component: "Multi-Expert", overhead: 5,  simagv: "并行多约束推理" },
  { component: "Feasibility masks", overhead: 2, simagv: "安全/电量/碰撞预过滤" },
  { component: "Total",        overhead: 10, simagv: "vs AM（中型规模）" },
];

/* ---- E7: tick budget reference line ---- */
export const tickBudgetMs = 100;
