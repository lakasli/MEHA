import type { Experiment, RunStatus } from "@/types/experiment";
import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import "./RunControls.css";

interface RunControlsProps {
  experiment: Experiment;
  status: RunStatus;
  progress: number;
  stageIndex: number;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function RunControls({
  experiment,
  status,
  progress,
  stageIndex,
  onRun,
  onStop,
  onReset,
}: RunControlsProps) {
  const isRunning = status === "running";
  const isDone = status === "completed" || status === "stopped";
  const currentStage = experiment.stages[Math.min(stageIndex, experiment.stages.length - 1)];

  const progressTone: "active" | "done" | "idle" =
    isRunning ? "active" : isDone ? "done" : "idle";

  return (
    <div className="run-controls">
      <div className="run-controls__buttons">
        {!isRunning ? (
          <Button
            variant="primary"
            onClick={onRun}
            disabled={isDone && progress >= 100}
            aria-label={`Run experiment ${experiment.key}`}
          >
            {isDone && progress >= 100 ? "已完成" : `运行 ${experiment.key}`}
          </Button>
        ) : (
          <Button variant="danger" onClick={onStop}>
            停止
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={isRunning || status === "idle"}
        >
          重置
        </Button>
      </div>

      <ProgressBar
        value={progress}
        label={currentStage?.label}
        detail={currentStage?.detail}
        tone={progressTone}
      />

      <ol className="run-controls__stages" aria-label="运行阶段">
        {experiment.stages.map((stage, i) => {
          const state =
            i < stageIndex ? "done" :
            i === stageIndex && isRunning ? "active" :
            i === stageIndex && isDone ? "done" :
            "pending";
          return (
            <li
              key={stage.key}
              className={["run-controls__stage", `run-controls__stage--${state}`]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="run-controls__stage-marker" aria-hidden>
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className="run-controls__stage-label">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
