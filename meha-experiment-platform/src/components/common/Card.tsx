import type { ReactNode } from "react";
import "./Card.css";

interface CardProps {
  /** Optional eyebrow label rendered above the title in small caps. */
  eyebrow?: string;
  title?: ReactNode;
  /** Optional right-aligned slot in the header (e.g. a status badge). */
  aside?: ReactNode;
  children: ReactNode;
  /** Extra class for spacing variants (e.g. "card--flush"). */
  className?: string;
  /** HTML id for the section, useful for keyboard jump links. */
  id?: string;
}

export function Card({ eyebrow, title, aside, children, className, id }: CardProps) {
  const cls = ["card", className].filter(Boolean).join(" ");
  return (
    <section className={cls} id={id}>
      {(eyebrow || title || aside) && (
        <header className="card__header">
          <div className="card__heading">
            {eyebrow && <div className="card__eyebrow eyebrow">{eyebrow}</div>}
            {title && <h3 className="card__title">{title}</h3>}
          </div>
          {aside && <div className="card__aside">{aside}</div>}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}
