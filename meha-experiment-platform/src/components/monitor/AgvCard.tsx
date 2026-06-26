import type { AgvOperatingMode, AgvStatus } from "@/types/agv";
import { Badge } from "@/components/common/Badge";
import "./AgvCard.css";

interface AgvCardProps {
  agv: AgvStatus;
}

const modeTone: Record<
  AgvOperatingMode,
  "neutral" | "active" | "done" | "warning" | "error"
> = {
  IDLE: "neutral",
  EXECUTING: "active",
  CHARGING: "done",
  ERROR: "error",
  OFFLINE: "neutral",
};

const modeLabel: Record<AgvOperatingMode, string> = {
  IDLE: "空闲",
  EXECUTING: "执行中",
  CHARGING: "充电中",
  ERROR: "错误",
  OFFLINE: "离线",
};

/** Format radians as a compass heading in degrees. */
function heading(theta: number): string {
  const deg = ((theta * 180) / Math.PI + 360) % 360;
  return `${deg.toFixed(0)}°`;
}

export function AgvCard({ agv }: AgvCardProps) {
  const batteryTone =
    agv.batteryCharge < 20 ? "low" : agv.batteryCharge < 40 ? "mid" : "ok";

  return (
    <article
      className={[
        "agv-card",
        `agv-card--${agv.operatingMode.toLowerCase()}`,
      ].join(" ")}
      aria-label={`${agv.label} status card`}
    >
      <header className="agv-card__head">
        <span className="agv-card__label">{agv.label}</span>
        <Badge tone={modeTone[agv.operatingMode]} dot>
          {modeLabel[agv.operatingMode]}
        </Badge>
      </header>

      <dl className="agv-card__stats">
        <div className="agv-card__stat">
          <dt>位置</dt>
          <dd className="numerals">
            {agv.position.x.toFixed(1)}, {agv.position.y.toFixed(1)}
            <span className="agv-card__heading"> · {heading(agv.position.theta)}</span>
          </dd>
        </div>
        <div className="agv-card__stat">
          <dt>速度</dt>
          <dd className="numerals">
            {agv.speed.toFixed(2)} <span className="agv-card__unit">m/s</span>
          </dd>
        </div>
        <div className="agv-card__stat">
          <dt>载货</dt>
          <dd>{agv.loadState === "LOADED" ? "有货" : "空载"}</dd>
        </div>
      </dl>

      <div className="agv-card__battery">
        <div className="agv-card__battery-meta">
          <span className="agv-card__battery-label">电量</span>
          <span className="agv-card__battery-value numerals">
            {agv.batteryCharge.toFixed(0)}%
          </span>
        </div>
        <div
          className={`agv-card__battery-bar agv-card__battery-bar--${batteryTone}`}
          role="progressbar"
          aria-valuenow={Math.round(agv.batteryCharge)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="agv-card__battery-fill"
            style={{ width: `${agv.batteryCharge}%` }}
          />
        </div>
      </div>

      {agv.activeOrderId && (
        <div className="agv-card__order">
          <span className="agv-card__order-label">订单</span>
          <code className="agv-card__order-id">{agv.activeOrderId}</code>
        </div>
      )}

      {agv.lastError && (
        <p className="agv-card__error">{agv.lastError}</p>
      )}
    </article>
  );
}
