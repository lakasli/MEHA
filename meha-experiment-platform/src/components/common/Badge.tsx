import type { ReactNode } from "react";
import "./Badge.css";

type BadgeTone =
  | "neutral"
  | "active"     // running / live
  | "done"       // completed
  | "warning"    // caution
  | "error"      // failure
  | "ours";      // MEHA highlighting

interface BadgeProps {
  tone?: BadgeTone;
  /** Optional leading dot. */
  dot?: boolean;
  children: ReactNode;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge--neutral",
  active: "badge--active",
  done: "badge--done",
  warning: "badge--warning",
  error: "badge--error",
  ours: "badge--ours",
};

export function Badge({ tone = "neutral", dot = false, children }: BadgeProps) {
  return (
    <span className={["badge", toneClass[tone], dot && "badge--dot"]
      .filter(Boolean)
      .join(" ")}>
      {dot && <span className="badge__dot" aria-hidden />}
      <span className="badge__label">{children}</span>
    </span>
  );
}
