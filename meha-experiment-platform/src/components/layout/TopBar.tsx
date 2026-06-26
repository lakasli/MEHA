import type { ReactNode } from "react";
import type { PanelKey, ExperimentKey } from "@/types/experiment";
import "./TopBar.css";

interface TopBarProps {
  activePanel: PanelKey;
  activeExperiment: ExperimentKey;
  experimentTitle: string;
  experimentSection: string;
  /** Right-aligned slot for live status / run controls. */
  aside?: ReactNode;
}

const panelLabels: Record<PanelKey, string> = {
  runner: "运行器",
  monitor: "实时监控",
  results: "结果",
};

export function TopBar({
  activePanel,
  activeExperiment,
  experimentTitle,
  experimentSection,
  aside,
}: TopBarProps) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar__crumbs">
        <span className="topbar__crumb">{panelLabels[activePanel]}</span>
        <span className="topbar__sep" aria-hidden>/</span>
        <span className="topbar__crumb topbar__crumb--muted numerals">
          {activeExperiment}
        </span>
        <span className="topbar__sep" aria-hidden>·</span>
        <span className="topbar__title">{experimentTitle}</span>
      </div>
      <div className="topbar__meta">
        <span className="topbar__section">{experimentSection}</span>
      </div>
      {aside && <div className="topbar__aside">{aside}</div>}
    </header>
  );
}
