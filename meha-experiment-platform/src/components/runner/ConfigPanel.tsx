import type { Experiment } from "@/types/experiment";
import "./ConfigPanel.css";

interface ConfigPanelProps {
  experiment: Experiment;
}

export function ConfigPanel({ experiment }: ConfigPanelProps) {
  return (
    <div className="config-panel">
      <div className="config-panel__distributions">
        <span className="eyebrow">数据分布</span>
        <ul className="config-panel__dist-list">
          {experiment.distributions.map((d) => (
            <li key={d} className="config-panel__dist">
              <code className="config-panel__dist-code">{d}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="config-panel__groups">
        {experiment.paramGroups.map((group) => (
          <div key={group.label} className="config-panel__group">
            <div className="config-panel__group-label eyebrow">{group.label}</div>
            <dl className="config-panel__items">
              {group.items.map((item) => (
                <div key={item.name} className="config-panel__item">
                  <dt className="config-panel__item-name">{item.name}</dt>
                  <dd className="config-panel__item-value">
                    <span className="config-panel__value numerals">
                      {item.value}
                      {item.unit && (
                        <span className="config-panel__unit"> {item.unit}</span>
                      )}
                    </span>
                    {item.note && (
                      <span className="config-panel__note">{item.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
