import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentKey, RunStatus } from "@/types/experiment";

interface RunState {
  status: RunStatus;
  progress: number;
  stageIndex: number;
  runId: string | null;
  error?: string;
}

interface RunApiResponse {
  runId: string;
}

interface TickApiResponse {
  experimentKey: string;
  status: "running" | "completed";
  progress: number;
  stageIndex: number;
  startedAt: number;
}

const initialState: RunState = {
  status: "idle",
  progress: 0,
  stageIndex: 0,
  runId: null,
};

/**
 * Drives the experiment run lifecycle. The MSW mock exposes
 * POST /api/experiments/:key/run to start, and
 * GET  /api/runs/:id/tick to advance progress server-side.
 *
 * The hook polls the tick endpoint on an interval while running,
 * and stops polling when status flips to "completed".
 */
export function useExperimentRun() {
  const [state, setState] = useState<RunState>(initialState);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const start = useCallback(
    async (experimentKey: ExperimentKey) => {
      setState({ ...initialState, status: "running" });
      try {
        const res = await fetch(`/api/experiments/${experimentKey}/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { runId } = (await res.json()) as RunApiResponse;
        setState({
          status: "running",
          progress: 0,
          stageIndex: 0,
          runId,
        });

        stopPolling();
        pollRef.current = window.setInterval(async () => {
          try {
            const r = await fetch(`/api/runs/${runId}/tick`);
            if (!r.ok) return;
            const data = (await r.json()) as TickApiResponse;
            setState({
              status: data.status === "completed" ? "completed" : "running",
              progress: data.progress,
              stageIndex: data.stageIndex,
              runId,
            });
            if (data.status === "completed") {
              stopPolling();
            }
          } catch {
            /* swallow transient poll errors */
          }
        }, 600);
      } catch (err) {
        setState({
          ...initialState,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [stopPolling],
  );

  const stop = useCallback(async () => {
    if (state.runId) {
      try {
        await fetch(`/api/runs/${state.runId}/stop`, { method: "POST" });
      } catch {
        /* even if the stop call fails we still freeze locally */
      }
    }
    stopPolling();
    setState((s) => ({ ...s, status: "stopped" }));
  }, [state.runId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState(initialState);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { ...state, start, stop, reset };
}
