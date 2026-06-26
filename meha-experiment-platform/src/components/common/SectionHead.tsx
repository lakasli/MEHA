import type { ReactNode } from "react";
import "./SectionHead.css";

interface SectionHeadProps {
  /** Small caps eyebrow above the title. */
  eyebrow?: string;
  title: ReactNode;
  /** Optional supporting paragraph below the title. */
  lead?: ReactNode;
  /** Optional right-aligned slot (e.g. view switcher, count). */
  aside?: ReactNode;
}

export function SectionHead({ eyebrow, title, lead, aside }: SectionHeadProps) {
  return (
    <div className="section-head">
      <div className="section-head__main">
        {eyebrow && <div className="section-head__eyebrow eyebrow">{eyebrow}</div>}
        <h2 className="section-head__title">{title}</h2>
        {lead && <p className="section-head__lead">{lead}</p>}
      </div>
      {aside && <div className="section-head__aside">{aside}</div>}
    </div>
  );
}
