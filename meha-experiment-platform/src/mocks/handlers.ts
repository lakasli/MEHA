import { http, HttpResponse, delay } from "msw";
import type { JsonBodyType } from "msw";
import { experiments, experimentsByKey } from "./data/experiments";
import { agvFleet, fleetSummary } from "./data/agvFleet";
import { buildSeedMessages } from "./data/mqttMessages";
import {
  e1Rows, e7Rows, e7Breakdown, tickBudgetMs,
  methodLabels, degradationPoints,
  ablationComponents, ablationDistributions,
  gatingMatrix, gatingExpertRoles,
} from "./data/results";

const base = "/api";

/** In-memory run registry — sufficient for a frontend-only mock. */
const runs = new Map<string, {
  experimentKey: string;
  status: "running" | "completed";
  progress: number;
  stageIndex: number;
  startedAt: number;
}>();

function json(body: JsonBodyType, init?: ResponseInit) {
  return HttpResponse.json(body, init);
}

export const handlers = [
  /* ---- Experiments ---- */
  http.get(`${base}/experiments`, async () => {
    await delay(80);
    return json(experiments);
  }),

  http.get(`${base}/experiments/:key`, async ({ params }) => {
    await delay(60);
    const exp = experimentsByKey[params.key as string];
    if (!exp) return json({ error: "experiment not found" }, { status: 404 });
    return json(exp);
  }),

  /* ---- AGV fleet ---- */
  http.get(`${base}/agv-fleet`, async () => {
    await delay(100);
    return json(agvFleet);
  }),

  http.get(`${base}/agv-fleet/summary`, async () => {
    await delay(80);
    return json(fleetSummary);
  }),

  /* ---- MQTT seed stream ---- */
  http.get(`${base}/mqtt/seed`, async () => {
    await delay(120);
    return json(buildSeedMessages());
  }),

  /* ---- Results ---- */
  http.get(`${base}/results/e1`, async () => {
    await delay(150);
    return json(e1Rows);
  }),

  http.get(`${base}/results/e2`, async () => {
    await delay(150);
    return json({ methods: methodLabels, points: degradationPoints });
  }),

  http.get(`${base}/results/e4`, async () => {
    await delay(150);
    return json({
      distributions: ablationDistributions,
      components: ablationComponents,
    });
  }),

  http.get(`${base}/results/e6`, async () => {
    await delay(150);
    return json({ matrix: gatingMatrix, expertRoles: gatingExpertRoles });
  }),

  http.get(`${base}/results/e7`, async () => {
    await delay(150);
    return json({ rows: e7Rows, breakdown: e7Breakdown, tickBudgetMs });
  }),

  /* ---- Run control ---- */
  http.post(`${base}/experiments/:key/run`, async ({ params }) => {
    const key = params.key as string;
    if (!experimentsByKey[key]) {
      return json({ error: "experiment not found" }, { status: 404 });
    }
    const id = `run-${key}-${Date.now().toString(36)}`;
    runs.set(id, {
      experimentKey: key,
      status: "running",
      progress: 0,
      stageIndex: 0,
      startedAt: Date.now(),
    });
    return json({ runId: id });
  }),

  http.get(`${base}/runs/:id`, async ({ params }) => {
    const id = params.id as string;
    const run = runs.get(id);
    if (!run) return json({ error: "run not found" }, { status: 404 });
    return json(run);
  }),

  /* ---- Run progress stream (simulated via repeated GET) ----
     The frontend polls this endpoint; we advance progress server-side. */
  http.get(`${base}/runs/:id/tick`, async ({ params }) => {
    const id = params.id as string;
    const run = runs.get(id);
    if (!run) return json({ error: "run not found" }, { status: 404 });

    const exp = experimentsByKey[run.experimentKey];
    const stageCount = exp.stages.length;
    // advance ~8-14% per tick
    const step = 8 + Math.random() * 6;
    run.progress = Math.min(100, run.progress + step);
    run.stageIndex = Math.min(
      stageCount - 1,
      Math.floor((run.progress / 100) * stageCount),
    );
    if (run.progress >= 100) {
      run.status = "completed";
      run.stageIndex = stageCount - 1;
    }
    return json(run);
  }),

  http.post(`${base}/runs/:id/stop`, async ({ params }) => {
    const id = params.id as string;
    const run = runs.get(id);
    if (!run) return json({ error: "run not found" }, { status: 404 });
    run.status = "completed";
    run.progress = run.progress; // freeze
    return json(run);
  }),
];
