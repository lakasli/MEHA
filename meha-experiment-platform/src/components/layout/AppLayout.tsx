import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ArchStrip } from "./ArchStrip";
import type { PanelKey, ExperimentKey, Experiment } from "@/types/experiment";
import "./AppLayout.css";

interface AppLayoutProps {
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  experiments: Pick<Experiment, "key" | "title" | "section">[];
  activeExperiment: ExperimentKey;
  onExperimentChange: (key: ExperimentKey) => void;
  activeExperimentTitle: string;
  activeExperimentSection: string;
  brokerOnline: boolean;
  agvCount: number;
  uptimeLabel: string;
  /** Which pipeline node the current panel highlights. */
  activeArchNode?: "meha" | "mqtt" | "vda" | "simagv";
  /** Optional aside slot for the TopBar (e.g. run controls summary). */
  topBarAside?: ReactNode;
  children: ReactNode;
}

export function AppLayout({
  activePanel,
  onPanelChange,
  experiments,
  activeExperiment,
  onExperimentChange,
  activeExperimentTitle,
  activeExperimentSection,
  brokerOnline,
  agvCount,
  uptimeLabel,
  activeArchNode,
  topBarAside,
  children,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        experiments={experiments}
        activeExperiment={activeExperiment}
        onExperimentChange={onExperimentChange}
        brokerOnline={brokerOnline}
        agvCount={agvCount}
        uptimeLabel={uptimeLabel}
      />
      <div className="app-layout__main">
        <TopBar
          activePanel={activePanel}
          activeExperiment={activeExperiment}
          experimentTitle={activeExperimentTitle}
          experimentSection={activeExperimentSection}
          aside={topBarAside}
        />
        <ArchStrip activeNode={activeArchNode} />
        <main className="app-layout__content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
