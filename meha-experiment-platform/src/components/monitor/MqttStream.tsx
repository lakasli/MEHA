import { useEffect, useRef } from "react";
import type { MqttMessage, MqttStreamStats } from "@/types/mqtt";
import { Button } from "@/components/common/Button";
import { StatusDot } from "@/components/common/StatusDot";
import "./MqttStream.css";

interface MqttStreamProps {
  messages: MqttMessage[];
  stats: MqttStreamStats;
  active: boolean;
  onToggle: () => void;
  onClear: () => void;
}

/** Pad a number to 2 digits. */
const pad = (n: number) => n.toString().padStart(2, "0");

/** Format an epoch ms timestamp as HH:MM:SS.mmm. */
function formatTime(ms: number): string {
  const d = new Date(ms);
  return (
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `.${d.getMilliseconds().toString().padStart(3, "0")}`
  );
}

/** Format bytes/sec as a human-readable rate. */
function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
}

export function MqttStream({
  messages,
  stats,
  active,
  onToggle,
  onClear,
}: MqttStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // Track whether the user is parked at the bottom; only auto-scroll then.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 32;
      stickRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="mqtt-stream">
      <header className="mqtt-stream__header">
        <div className="mqtt-stream__title">
          <StatusDot
            tone={active ? "busy" : "off"}
            pulse={active}
            label={active ? "流实时" : "流已暂停"}
          />
          <span className="mqtt-stream__title-text">MQTT 记录</span>
          <span className="mqtt-stream__topic-hint">
            uagv/meha/{"{serial}"}/{"{order|state|instantActions|visualization|connection}"}
          </span>
        </div>
        <div className="mqtt-stream__actions">
          <div className="mqtt-stream__rate">
            <span className="numerals">{stats.ratePerSec}</span>
            <span className="mqtt-stream__rate-label">条/秒</span>
          </div>
          <div className="mqtt-stream__rate">
            <span className="numerals">{formatRate(stats.bytesPerSec)}</span>
          </div>
          <div className="mqtt-stream__rate">
            <span className="mqtt-stream__rate-label">总计</span>
            <span className="numerals">{stats.total}</span>
          </div>
          <Button variant="ghost" onClick={onToggle}>
            {active ? "暂停" : "恢复"}
          </Button>
          <Button variant="ghost" onClick={onClear}>
            清空
          </Button>
        </div>
      </header>

      <div className="mqtt-stream__scroll" ref={scrollRef}>
        <ol className="mqtt-stream__list">
          {messages.map((m) => (
            <li
              key={m.id}
              className={[
                "mqtt-stream__msg",
                `mqtt-stream__msg--${m.direction}`,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="mqtt-stream__msg-meta">
                <span className="mqtt-stream__arrow" aria-hidden>
                  {m.direction === "out" ? "→" : "←"}
                </span>
                <span className="mqtt-stream__time numerals">
                  {formatTime(m.timestamp)}
                </span>
                <span className="mqtt-stream__kind">{m.kindLabel}</span>
                <span className="mqtt-stream__topic">{m.topic}</span>
                <span className="mqtt-stream__bytes numerals">{m.bytes}B</span>
              </div>
              <pre className="mqtt-stream__payload">{m.payload}</pre>
            </li>
          ))}
          {messages.length === 0 && (
            <li className="mqtt-stream__empty">
              暂无消息。当代理发布第一帧时，记录将开始显示。
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}
