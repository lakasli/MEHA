import { useEffect } from "react";
import { useExperimentContext } from "@/contexts/ExperimentContext";
import { useExperimentRun } from "@/hooks/useExperimentRun";
import { experiments as allExperiments } from "@/mocks/data/experiments";
import { SectionHead } from "@/components/common/SectionHead";
import { Card } from "@/components/common/Card";
import { ExperimentSelector } from "./ExperimentSelector";
import { ConfigPanel } from "./ConfigPanel";
import { ExpectedOutcome } from "./ExpectedOutcome";
import { RunControls } from "./RunControls";
import "./ExperimentRunner.css";

export function ExperimentRunner() {
  const { activeExperiment, setActiveExperiment, setRunState } = useExperimentContext();
  const run = useExperimentRun();

  // Keep the shared context in sync so the TopBar aside can show progress.
  useEffect(() => {
    setRunState({
      status: run.status,
      progress: run.progress,
      stageIndex: run.stageIndex,
      runId: run.runId,
    });
  }, [run.status, run.progress, run.stageIndex, run.runId, setRunState]);

  const experiment = allExperiments.find((e) => e.key === activeExperiment) ?? allExperiments[0];

  // Only the active experiment shows a status badge in the selector.
  const statusByKey = { [activeExperiment]: run.status };

  return (
    <div className="experiment-runner">
      <SectionHead
        eyebrow="实验运行器"
        title="配置、调度、观察"
        lead="从 §5 中选择一个实验，在远程 SimAGV3.0 上运行。运行器通过 MQTT 发布 VDA5050 订单，并收集状态主题，直到所有实例完成。"
      />

      <div className="experiment-runner__grid">
        <div className="experiment-runner__col experiment-runner__col--selector">
          <ExperimentSelector
            experiments={allExperiments}
            active={activeExperiment}
            onChange={setActiveExperiment}
            statusByKey={statusByKey}
          />
        </div>

        <div className="experiment-runner__col experiment-runner__col--main">
          <Card eyebrow="配置" title={experiment.title} className="experiment-runner__config">
            <ConfigPanel experiment={experiment} />
          </Card>

          <Card eyebrow="假设" title="问题与预期结果" className="experiment-runner__expected">
            <ExpectedOutcome experiment={experiment} />
          </Card>

          <Card
            eyebrow="运行"
            title="调度至 SimAGV3.0"
            aside={<span className="experiment-runner__runid numerals">
              {run.runId ? run.runId : "—"}
            </span>}
            className="experiment-runner__run"
          >
            <RunControls
              experiment={experiment}
              status={run.status}
              progress={run.progress}
              stageIndex={run.stageIndex}
              onRun={() => void run.start(experiment.key)}
              onStop={() => void run.stop()}
              onReset={() => run.reset()}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
