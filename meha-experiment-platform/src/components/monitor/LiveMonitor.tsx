import { useState } from "react";
import { SectionHead } from "@/components/common/SectionHead";
import { Card } from "@/components/common/Card";
import { MqttStream } from "./MqttStream";
import { AgvCard } from "./AgvCard";
import { FleetSummary } from "./FleetSummary";
import { useMqttStream } from "@/hooks/useMqttStream";
import { useAgvFleet } from "@/hooks/useAgvFleet";
import "./LiveMonitor.css";

export function LiveMonitor() {
  const [active, setActive] = useState(true);
  const { messages, stats, clear } = useMqttStream({ active });
  const { fleet, summary, loading, error } = useAgvFleet(true);

  return (
    <div className="live-monitor">
      <SectionHead
        eyebrow="§0.3  实时监控"
        title="MQTT 桥接实时记录"
        lead={
          <>
            VDA 5050 桥接到 SimAGV3.0 的出站订单和入站状态帧，以及从
            <code className="live-monitor__inline"> uagv/meha/{"{serial}"}/state </code>
            主题读取的当前 AGV 车队信息。记录是编辑核心；车队网格则安静地记录每台车辆的运行状态。
          </>
        }
        aside={
          <span className="live-monitor__hint">
            <span className="eyebrow">节拍</span>
            <span className="numerals">1200 ms</span>
          </span>
        }
      />

      <div className="live-monitor__grid">
        <Card
          className="live-monitor__transcript-card"
          eyebrow="记录"
          title="MQTT 桥接"
          aside={
            <span className="live-monitor__hint">
              <span className="eyebrow">窗口</span>
              <span className="numerals">1 s 滚动</span>
            </span>
          }
        >
          <MqttStream
            messages={messages}
            stats={stats}
            active={active}
            onToggle={() => setActive((a) => !a)}
            onClear={clear}
          />
        </Card>

        <div className="live-monitor__aside">
          <Card
            eyebrow="车队"
            title="SimAGV3.0 车队"
            aside={
              <span className="live-monitor__hint">
                <span className="eyebrow">车辆数</span>
                <span className="numerals">{fleet.length}</span>
              </span>
            }
          >
            {summary && (
              <FleetSummary summary={summary} fleetSize={fleet.length} />
            )}
          </Card>

          <Card
            eyebrow="车辆"
            title="AGV 卡片"
            aside={
              <span className="live-monitor__hint">
                <span className="eyebrow">来源</span>
                <span>状态主题</span>
              </span>
            }
          >
            {loading && <p className="live-monitor__note">正在加载车队…</p>}
            {error && (
              <p className="live-monitor__note live-monitor__note--error">
                车队加载失败: {error}
              </p>
            )}
            <div className="live-monitor__fleet-grid">
              {fleet.map((agv) => (
                <AgvCard key={agv.serial} agv={agv} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
