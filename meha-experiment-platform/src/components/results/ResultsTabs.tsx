import "./ResultsTabs.css";

export type ResultsTab = "e1" | "e2" | "e4" | "e6" | "e7";

interface ResultsTabsProps {
  active: ResultsTab;
  onChange: (tab: ResultsTab) => void;
}

interface TabSpec {
  key: ResultsTab;
  label: string;
  section: string;
}

const TABS: TabSpec[] = [
  { key: "e1", label: "E1 · 同分布", section: "§5.2.1" },
  { key: "e2", label: "E2 · 跨分布", section: "§5.2.2" },
  { key: "e4", label: "E4 · 消融", section: "§5.3.1" },
  { key: "e6", label: "E6 · 门控权重", section: "§5.3.2" },
  { key: "e7", label: "E7 · 推理时间", section: "§5.3.3" },
];

export function ResultsTabs({ active, onChange }: ResultsTabsProps) {
  return (
    <nav className="results-tabs" aria-label="结果章节">
      <ol className="results-tabs__list">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <li key={t.key} className="results-tabs__item">
              <button
                type="button"
                className={[
                  "results-tabs__tab",
                  isActive ? "results-tabs__tab--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onChange(t.key)}
              >
                <span className="results-tabs__section">{t.section}</span>
                <span className="results-tabs__label">{t.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
