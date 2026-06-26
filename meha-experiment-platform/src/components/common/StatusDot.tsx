import "./StatusDot.css";

type StatusDotTone = "online" | "idle" | "busy" | "error" | "off";

interface StatusDotProps {
  tone: StatusDotTone;
  /** Pulse animation, used for "live" / "running" indicators. */
  pulse?: boolean;
  /** Accessible label — required so screen readers can announce state. */
  label: string;
}

const toneClass: Record<StatusDotTone, string> = {
  online: "status-dot--online",
  idle: "status-dot--idle",
  busy: "status-dot--busy",
  error: "status-dot--error",
  off: "status-dot--off",
};

export function StatusDot({ tone, pulse = false, label }: StatusDotProps) {
  return (
    <span
      className={["status-dot", toneClass[tone], pulse && "status-dot--pulse"]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
