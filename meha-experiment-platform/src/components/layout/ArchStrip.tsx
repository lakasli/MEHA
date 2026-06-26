import "./ArchStrip.css";

interface ArchStripProps {
  /** Indicates which link in the chain is currently active. */
  activeNode?: "meha" | "mqtt" | "vda" | "simagv";
}

interface Node {
  key: NonNullable<ArchStripProps["activeNode"]>;
  label: string;
  detail: string;
}

const nodes: Node[] = [
  { key: "meha",  label: "MEHA DRL",       detail: "多专家异质注意力" },
  { key: "mqtt",  label: "MQTT 桥接",    detail: "paho-mqtt · QoS1 · 自动重连" },
  { key: "vda",   label: "VDA 5050",       detail: "订单 · 状态 · 即时动作" },
  { key: "simagv",label: "SimAGV3.0",      detail: "远程 C++ · tickOnce() · SAT+A*" },
];

export function ArchStrip({ activeNode }: ArchStripProps) {
  return (
    <div className="archstrip" role="complementary" aria-label="架构流水线">
      <span className="archstrip__eyebrow eyebrow">流水线</span>
      <ol className="archstrip__chain">
        {nodes.map((n, i) => {
          const active = n.key === activeNode;
          return (
            <li
              key={n.key}
              className={["archstrip__node", active && "archstrip__node--active"]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "step" : undefined}
            >
              <span className="archstrip__label">{n.label}</span>
              <span className="archstrip__detail">{n.detail}</span>
              {i < nodes.length - 1 && (
                <span className="archstrip__arrow" aria-hidden>→</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
