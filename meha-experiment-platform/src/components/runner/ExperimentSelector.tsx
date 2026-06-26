import type { Experiment, ExperimentKey, RunStatus } from "@/types/experiment";
import { Badge } from "@/components/common/Badge";
import "./ExperimentSelector.css";

interface ExperimentSelectorProps {
  experiments: Experiment[];
  active: ExperimentKey;
  onChange: (key: ExperimentKey) => void;
  /** Per-experiment run status, so cards can show a state badge. */
  statusByKey?: Partial<Record<ExperimentKey, RunStatus>>;
}

function statusBadgeTone(status: RunStatus):
  | "neutral"
  | "active"
  | "done"
  | "warning"
  | "error" {
  switch (status) {
    case "running":   return "active";
    case "completed": return "done";
    case "stopped":   return "warning";
    case "error":     return "error";
    default:          return "neutral";
  }
}

function statusLabel(status: RunStatus): string {
  switch (status) {
    case "running":   return "运行中";
    case "completed": return "已完成";
    case "stopped":   return "已停止";
    case "error":     return "错误";
    default:          return "就绪";
  }
}

export function ExperimentSelector({
  experiments,
  active,
  onChange,
  statusByKey = {},
}: ExperimentSelectorProps) {
  return (
    <div className="exp-selector" role="listbox" aria-label="实验列表">
      {experiments.map((exp) => {
        const isActive = exp.key === active;
        const status = statusByKey[exp.key] ?? "idle";
        return (
          <button
            key={exp.key}
            type="button"
            role="option"
            aria-selected={isActive}
            className={[
              "exp-selector__item",
              isActive && "exp-selector__item--active",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(exp.key)}
          >
            <div className="exp-selector__head">
              <span className="exp-selector__key numerals">{exp.key}</span>
              <span className="exp-selector__section">{exp.section}</span>
              <span className="exp-selector__badge">
                <Badge tone={statusBadgeTone(status)} dot>
                  {statusLabel(status)}
                </Badge>
              </span>
            </div>
            <div className="exp-selector__title">{exp.title}</div>
            <div className="exp-selector__subtitle">{exp.subtitle}</div>
            <div className="exp-selector__question">{exp.question}</div>
          </button>
        );
      })}
    </div>
  );
}
