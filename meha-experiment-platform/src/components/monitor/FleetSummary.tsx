import type { FleetSummary as FleetSummaryData } from "@/types/agv";
import "./FleetSummary.css";

interface FleetSummaryProps {
  summary: FleetSummaryData;
  fleetSize: number;
}

interface StatSpec {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "active" | "warning" | "error" | "done";
}

function formatMakespan(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FleetSummary({ summary, fleetSize }: FleetSummaryProps) {
  const stats: StatSpec[] = [
    {
      key: "active",
      label: "活跃任务",
      value: String(summary.activeTasks),
      detail: `共 ${fleetSize} 台 AGV`,
      tone: summary.activeTasks > 0 ? "active" : "neutral",
    },
    {
      key: "collisions",
      label: "碰撞次数",
      value: String(summary.collisions),
      detail: summary.collisions > 0 ? "需检查" : "无警告",
      tone: summary.collisions > 0 ? "error" : "done",
    },
    {
      key: "estop",
      label: "急停次数",
      value: String(summary.emergencyStops),
      detail: summary.emergencyStops > 0 ? "已触发" : "无",
      tone: summary.emergencyStops > 0 ? "error" : "done",
    },
    {
      key: "battery",
      label: "平均电量",
      value: `${summary.averageBattery.toFixed(0)}%`,
      detail: summary.averageBattery < 30 ? "电量偏低" : "正常",
      tone: summary.averageBattery < 30 ? "warning" : "done",
    },
    {
      key: "makespan",
      label: "完工时间",
      value: formatMakespan(summary.makespan),
      detail: "自首个订单起",
      tone: "neutral",
    },
  ];

  return (
    <div className="fleet-summary" aria-label="车队摘要">
      {stats.map((s) => (
        <div key={s.key} className={`fleet-summary__cell fleet-summary__cell--${s.tone}`}>
          <span className="fleet-summary__label">{s.label}</span>
          <span className="fleet-summary__value numerals">{s.value}</span>
          <span className="fleet-summary__detail">{s.detail}</span>
        </div>
      ))}
    </div>
  );
}
