import { useEffect, useMemo } from "react";
import { ExperimentProvider, useExperimentContext, formatUptime } from "@/contexts/ExperimentContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExperimentRunner } from "@/components/runner/ExperimentRunner";
import { LiveMonitor } from "@/components/monitor/LiveMonitor";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { experiments as allExperiments } from "@/mocks/data/experiments";
import { agvFleet } from "@/mocks/data/agvFleet";
import { ProgressBar } from "@/components/common/ProgressBar";
import "./App.css";

function AppShell() {
  const {
    activePanel,
    setActivePanel,
    activeExperiment,
    setActiveExperiment,
    runStatus,
    runProgress,
    uptimeSeconds,
  } = useExperimentContext();

  const activeExperimentMeta = useMemo(() => {
    const exp = allExperiments.find((e) => e.key === activeExperiment) ?? allExperiments[0];
    return { title: exp.title, section: exp.section };
  }, [activeExperiment]);

  // Keyboard shortcuts: 1/2/3 switches panels; Ctrl+R resets to runner.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "1") { e.preventDefault(); setActivePanel("runner"); }
      else if (e.key === "2") { e.preventDefault(); setActivePanel("monitor"); }
      else if (e.key === "3") { e.preventDefault(); setActivePanel("results"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActivePanel]);

  // Which pipeline node the ArchStrip should highlight.
  const activeArchNode: "meha" | "mqtt" | "vda" | "simagv" =
    activePanel === "runner" ? "meha"
    : activePanel === "monitor" ? "mqtt"
    : "simagv";

  const topBarAside =
    runStatus === "running" || runStatus === "completed" || runStatus === "stopped" ? (
      <div className="app__topbar-run">
        <span className="app__topbar-run-label eyebrow">
          {runStatus === "running" ? "运行中" : runStatus === "completed" ? "已完成" : "已停止"}
        </span>
        <ProgressBar
          value={runProgress}
          tone={runStatus === "running" ? "active" : runStatus === "completed" ? "done" : "idle"}
          showPercent={false}
        />
      </div>
    ) : null;

  return (
    <AppLayout
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      experiments={allExperiments.map((e) => ({ key: e.key, title: e.title, section: e.section }))}
      activeExperiment={activeExperiment}
      onExperimentChange={setActiveExperiment}
      activeExperimentTitle={activeExperimentMeta.title}
      activeExperimentSection={activeExperimentMeta.section}
      brokerOnline
      agvCount={agvFleet.length}
      uptimeLabel={formatUptime(uptimeSeconds)}
      activeArchNode={activeArchNode}
      topBarAside={topBarAside}
    >
      {activePanel === "runner" && <ExperimentRunner />}
      {activePanel === "monitor" && <LiveMonitor />}
      {activePanel === "results" && <ResultsPanel />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ExperimentProvider>
      <AppShell />
    </ExperimentProvider>
  );
}
