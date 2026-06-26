import type { ReactNode } from "react";
import type { PanelKey, ExperimentKey } from "@/types/experiment";
import { StatusDot } from "@/components/common/StatusDot";
import "./Sidebar.css";

interface SidebarProps {
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  experiments: { key: ExperimentKey; title: string; section: string }[];
  activeExperiment: ExperimentKey;
  onExperimentChange: (key: ExperimentKey) => void;
  brokerOnline: boolean;
  agvCount: number;
  uptimeLabel: string;
}

const panelNav: { key: PanelKey; label: string; hint: string }[] = [
  { key: "runner",  label: "运行器",  hint: "配置并启动实验" },
  { key: "monitor", label: "实时监控", hint: "MQTT 数据流与 AGV 车队" },
  { key: "results", label: "结果", hint: "表格、图表、门控热力图" },
];

export function Sidebar({
  activePanel,
  onPanelChange,
  experiments,
  activeExperiment,
  onExperimentChange,
  brokerOnline,
  agvCount,
  uptimeLabel,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="平台导航">
      <div className="sidebar__brand">
        <div className="sidebar__mark" aria-hidden>
          <span className="sidebar__mark-glyph">M</span>
        </div>
        <div className="sidebar__brand-text">
          <div className="sidebar__brand-name">MEHA</div>
          <div className="sidebar__brand-sub">实验平台</div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="视图">
        {panelNav.map((item) => {
          const active = item.key === activePanel;
          return (
            <button
              key={item.key}
              type="button"
              className={["sidebar__nav-item", active && "sidebar__nav-item--active"]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
              onClick={() => onPanelChange(item.key)}
            >
              <span className="sidebar__nav-label">{item.label}</span>
              <span className="sidebar__nav-hint">{item.hint}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__section">
        <div className="sidebar__section-label eyebrow">实验</div>
        <ul className="sidebar__exp-list">
          {experiments.map((exp) => {
            const active = exp.key === activeExperiment;
            return (
              <li key={exp.key}>
                <button
                  type="button"
                  className={["sidebar__exp", active && "sidebar__exp--active"]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={active ? "true" : undefined}
                  onClick={() => onExperimentChange(exp.key)}
                >
                  <span className="sidebar__exp-key numerals">{exp.key}</span>
                  <span className="sidebar__exp-title">{exp.title}</span>
                  <span className="sidebar__exp-section">{exp.section}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <SidebarFooter
        brokerOnline={brokerOnline}
        agvCount={agvCount}
        uptimeLabel={uptimeLabel}
      />
    </aside>
  );
}

function SidebarFooter({
  brokerOnline,
  agvCount,
  uptimeLabel,
}: {
  brokerOnline: boolean;
  agvCount: number;
  uptimeLabel: string;
}): ReactNode {
  return (
    <div className="sidebar__footer">
      <div className="sidebar__footer-row">
        <StatusDot
          tone={brokerOnline ? "online" : "off"}
          pulse={brokerOnline}
          label={brokerOnline ? "MQTT 代理在线" : "MQTT 代理离线"}
        />
        <span className="sidebar__footer-label">MQTT 代理</span>
        <span className="sidebar__footer-value">
          {brokerOnline ? "在线" : "离线"}
        </span>
      </div>
      <div className="sidebar__footer-row">
        <span className="sidebar__footer-label">AGV 数量</span>
        <span className="sidebar__footer-value numerals">{agvCount}</span>
      </div>
      <div className="sidebar__footer-row">
        <span className="sidebar__footer-label">运行时间</span>
        <span className="sidebar__footer-value numerals">{uptimeLabel}</span>
      </div>
    </div>
  );
}
