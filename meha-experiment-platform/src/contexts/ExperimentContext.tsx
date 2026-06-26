import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExperimentKey, PanelKey, RunStatus } from "@/types/experiment";

interface ExperimentContextValue {
  activePanel: PanelKey;
  setActivePanel: (panel: PanelKey) => void;

  activeExperiment: ExperimentKey;
  setActiveExperiment: (key: ExperimentKey) => void;

  /** Run state shared between Runner panel and TopBar aside. */
  runStatus: RunStatus;
  runProgress: number;
  runStageIndex: number;
  runId: string | null;
  setRunState: (next: {
    status: RunStatus;
    progress?: number;
    stageIndex?: number;
    runId?: string | null;
  }) => void;

  /** Broker uptime — seconds since the platform started. */
  uptimeSeconds: number;
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelKey>("runner");
  const [activeExperiment, setActiveExperiment] = useState<ExperimentKey>("E1");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runProgress, setRunProgress] = useState(0);
  const [runStageIndex, setRunStageIndex] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  // Tick uptime once per second — cheap, and gives the sidebar a heartbeat.
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      setUptimeSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<ExperimentContextValue>(
    () => ({
      activePanel,
      setActivePanel,
      activeExperiment,
      setActiveExperiment,
      runStatus,
      runProgress,
      runStageIndex,
      runId,
      setRunState: (next) => {
        setRunStatus(next.status);
        if (next.progress !== undefined) setRunProgress(next.progress);
        if (next.stageIndex !== undefined) setRunStageIndex(next.stageIndex);
        if (next.runId !== undefined) setRunId(next.runId);
      },
      uptimeSeconds,
    }),
    [activePanel, activeExperiment, runStatus, runProgress, runStageIndex, runId, uptimeSeconds],
  );

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperimentContext(): ExperimentContextValue {
  const ctx = useContext(ExperimentContext);
  if (!ctx) {
    throw new Error("useExperimentContext must be used within ExperimentProvider");
  }
  return ctx;
}

/** Format seconds as `Hh Mm Ss` for the sidebar footer. */
export function formatUptime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}
