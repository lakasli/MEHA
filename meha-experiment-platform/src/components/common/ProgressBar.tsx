import "./ProgressBar.css";

interface ProgressBarProps {
  /** 0–100. */
  value: number;
  /** Optional label rendered above the bar, e.g. "Dispatching orders". */
  label?: string;
  /** Optional secondary line rendered under the bar. */
  detail?: string;
  /** Tone — default uses terracotta for in-progress; "done" uses sage. */
  tone?: "active" | "done" | "idle";
  /** Show the numeric percentage next to the label. */
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  label,
  detail,
  tone = "active",
  showPercent = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress progress--${tone}`}>
      {(label || showPercent) && (
        <div className="progress__head">
          {label && <span className="progress__label">{label}</span>}
          {showPercent && (
            <span className="progress__value numerals">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "progress"}
      >
        <div
          className="progress__fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {detail && <div className="progress__detail">{detail}</div>}
    </div>
  );
}
