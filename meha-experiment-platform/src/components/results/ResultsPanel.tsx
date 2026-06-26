import { useMemo, useState } from "react";
import { SectionHead } from "@/components/common/SectionHead";
import { Card } from "@/components/common/Card";
import { ResultsTabs, type ResultsTab } from "./ResultsTabs";
import { DataTable } from "./DataTable";
import { BarChart, type BarChartSeries } from "./BarChart";
import { Heatmap } from "./Heatmap";
import { useExperimentResults } from "@/hooks/useExperimentResults";
import type { AblationComponent, DegradationPoint, MethodLabel } from "@/types/results";
import "./ResultsPanel.css";

export function ResultsPanel() {
  const [tab, setTab] = useState<ResultsTab>("e1");
  const { e1, e2, e4, e6, e7, loading, error } = useExperimentResults();

  return (
    <div className="results-panel">
      <SectionHead
        eyebrow="§5  实验结果"
        title="七个实验的发现"
        lead="每个标签对应论文中的一个实验。E1 是同分布基准对比；E2 测量跨分布退化；E4 消融三个架构组件；E6 可视化门控网络；E7 报告在 SimAGV3.0 节拍预算下的推理时间。"
        aside={
          <span className="results-panel__hint">
            <span className="eyebrow">来源</span>
            <span>模拟 API</span>
          </span>
        }
      />

      <ResultsTabs active={tab} onChange={setTab} />

      {loading && <p className="results-panel__note">正在加载结果…</p>}
      {error && (
        <p className="results-panel__note results-panel__note--error">
          结果加载失败: {error}
        </p>
      )}

      {!loading && !error && (
        <div className="results-panel__body">
          {tab === "e1" && e1 && (
            <Card
              eyebrow="§5.2.1"
              title="同分布基准对比 (D_train)"
              aside={<span className="results-panel__hint"><span className="eyebrow">方法</span><span className="numerals">{e1.length}</span></span>}
            >
              <DataTable
                rows={e1}
                caption="MEHA 在训练分布上的 Gap 与 POMO 差距在 ±0.5% 以内，且碰撞次数为零。"
              />
            </Card>
          )}

          {tab === "e2" && e2 && <E2View methods={e2.methods} points={e2.points} />}
          {tab === "e4" && e4 && <E4View distributions={e4.distributions} components={e4.components} />}
          {tab === "e6" && e6 && <E6View matrix={e6.matrix} expertRoles={e6.expertRoles} />}
          {tab === "e7" && e7 && <E7View rows={e7.rows} breakdown={e7.breakdown} tickBudgetMs={e7.tickBudgetMs} />}
        </div>
      )}
    </div>
  );
}

/* ============== E2: cross-distribution degradation ============== */

interface E2ViewProps {
  methods: MethodLabel[];
  points: DegradationPoint[];
}

function E2View({ methods, points }: E2ViewProps) {
  const categories = useMemo(() => points.map((p) => p.distribution), [points]);
  const series: BarChartSeries[] = useMemo(
    () =>
      methods.map((m) => ({
        label: m.label,
        isOurs: m.isOurs,
        values: points.map((p) => p.values[m.key]),
      })),
    [methods, points],
  );

  return (
    <Card
      eyebrow="§5.2.2"
      title="跨分布退化"
      aside={<span className="results-panel__hint"><span className="eyebrow">分布数</span><span className="numerals">{categories.length}</span></span>}
    >
      <p className="results-panel__lead">
        值越低越好。MEHA 的多专家 + 门控架构在分布外场景
        (D_test4 异质 AGV、D_test7b 严格安全约束、D_test8b 低电量)
        下损失远低于 AM 或 POMO。
      </p>
      <BarChart
        mode="grouped"
        categories={categories}
        series={series}
        yLabel="退化率 (%)"
        unit="%"
        caption="分组柱状图：每簇代表一个测试分布。"
      />
    </Card>
  );
}

/* ============== E4: ablation stacked ============== */

interface E4ViewProps {
  distributions: string[];
  components: AblationComponent[];
}

function E4View({ distributions, components }: E4ViewProps) {
  const series: BarChartSeries[] = useMemo(
    () =>
      components.map((c) => ({
        label: c.label,
        values: distributions.map((d) => c.values[d] ?? 0),
      })),
    [components, distributions],
  );

  return (
    <Card
      eyebrow="§5.3.1"
      title="消融实验——各组件贡献"
      aside={<span className="results-panel__hint"><span className="eyebrow">变体数</span><span className="numerals">{components.length}</span></span>}
    >
      <p className="results-panel__lead">
        每个柱子堆叠了从完整 MEHA 中移除一个组件所引入的退化增量。移除多专家分支在所有
        分布上影响最大；TGate 是第二重要的；HeteAttn 单独影响最小但始终一致。
      </p>
      <BarChart
        mode="stacked"
        categories={distributions}
        series={series}
        yLabel="Δ Gap vs 完整 MEHA (%)"
        unit="%"
        caption="堆叠柱状图：每列总和等于独立移除三个组件所导致的全部退化。"
      />
    </Card>
  );
}

/* ============== E6: gating heatmap ============== */

interface E6ViewProps {
  matrix: import("@/types/results").GatingMatrix;
  expertRoles: string[];
}

function E6View({ matrix, expertRoles }: E6ViewProps) {
  return (
    <Card
      eyebrow="§5.3.2"
      title="专家门控权重"
      aside={<span className="results-panel__hint"><span className="eyebrow">专家数</span><span className="numerals">{matrix.experts.length}</span></span>}
    >
      <p className="results-panel__lead">
        每个单元格是 TGate 网络在给定分布上分配给特定专家的平均门控权重。
        块对角模式表明网络学会了专业化：每个专家在其训练的分布上占据主导，
        而 E₁ 保持通才角色。
      </p>
      <Heatmap
        matrix={matrix}
        expertRoles={expertRoles}
        caption="行：专家 (E₁–E₆)。列：测试分布。颜色越深 = 路由权重越大。"
      />
    </Card>
  );
}

/* ============== E7: inference timing ============== */

interface E7ViewProps {
  rows: import("@/types/results").E7Row[];
  breakdown: { component: string; overhead: number; simagv: string }[];
  tickBudgetMs: number;
}

function E7View({ rows, breakdown, tickBudgetMs }: E7ViewProps) {
  return (
    <Card
      eyebrow="§5.3.3"
      title="推理时间"
      aside={
        <span className="results-panel__hint">
          <span className="eyebrow">节拍预算</span>
          <span className="numerals">{tickBudgetMs} ms</span>
        </span>
      }
    >
      <p className="results-panel__lead">
        MEHA 推理在小型、中型和大型实例上都能轻松适配 SimAGV3.0 的节拍预算
        ({tickBudgetMs} ms)。相对于 AM 的开销来自并行的多专家推理，
        而其自身受最大专家网络限制。
      </p>

      <div className="results-panel__e7">
        <figure className="e7-table">
          <figcaption className="e7-table__caption">按实例规模的延迟 (ms)</figcaption>
          <div className="e7-table__scroll">
            <table>
              <thead>
                <tr>
                  <th>方法</th>
                  <th>小型 <span className="e7-table__unit">15 站点 · 10 AGV</span></th>
                  <th>中型 <span className="e7-table__unit">30 站点 · 20 AGV</span></th>
                  <th>大型 <span className="e7-table__unit">80 站点 · 30 AGV</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.method} className={r.isOurs ? "e7-table__row--ours" : ""}>
                    <td className="e7-table__method">
                      {r.isOurs && <span className="e7-table__mark" aria-hidden>★</span>}
                      {r.method}
                    </td>
                    <td className="numerals">{r.small}</td>
                    <td className="numerals">{r.medium}</td>
                    <td className="numerals">
                      {r.large}
                      {r.large > tickBudgetMs && (
                        <span className="e7-table__over">超预算</span>
                      )}
                      {r.isOurs && r.large <= tickBudgetMs && (
                        <span className="e7-table__ok">预算内</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>

        <aside className="e7-breakdown">
          <h4 className="e7-breakdown__title">MEHA 开销分解</h4>
          <ul className="e7-breakdown__list">
            {breakdown.map((b) => (
              <li key={b.component} className="e7-breakdown__item">
                <span className="e7-breakdown__component">{b.component}</span>
                <span className="e7-breakdown__overhead numerals">+{b.overhead} ms</span>
                <span className="e7-breakdown__simagv">{b.simagv}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Card>
  );
}
