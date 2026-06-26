import type { Experiment } from "@/types/experiment";
import "./ExpectedOutcome.css";

interface ExpectedOutcomeProps {
  experiment: Experiment;
}

export function ExpectedOutcome({ experiment }: ExpectedOutcomeProps) {
  return (
    <div className="expected">
      <div className="expected__row">
        <span className="expected__label eyebrow">研究问题</span>
        <p className="expected__question">{experiment.question}</p>
      </div>
      <hr className="expected__rule" />
      <div className="expected__row">
        <span className="expected__label eyebrow">预期结果</span>
        <p className="expected__outcome">{experiment.expected}</p>
      </div>
    </div>
  );
}
