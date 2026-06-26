import { useCallback, useEffect, useRef, useState } from "react";
import type { MqttMessage, MqttStreamStats } from "@/types/mqtt";
import { buildSeedMessages, sampleNextMessage } from "@/mocks/data/mqttMessages";

const MAX_MESSAGES = 200;

interface UseMqttStreamOptions {
  /** Whether the stream is "live" — i.e. new messages should keep arriving. */
  active: boolean;
  /** Interval range in ms; a fresh interval is sampled on each tick. */
  minInterval?: number;
  maxInterval?: number;
}

interface UseMqttStreamReturn {
  messages: MqttMessage[];
  stats: MqttStreamStats;
  clear: () => void;
  /** Push a synthetic message (e.g. when the user starts a run). */
  push: (msg: MqttMessage) => void;
}

/**
 * Streams MQTT messages from the MSW seed endpoint, then keeps sampling
 * locally. Kept self-contained so the Monitor panel can render in tests
 * without needing a server.
 */
export function useMqttStream({
  active,
  minInterval = 800,
  maxInterval = 1500,
}: UseMqttStreamOptions): UseMqttStreamReturn {
  const [messages, setMessages] = useState<MqttMessage[]>(() => buildSeedMessages());
  const [stats, setStats] = useState<MqttStreamStats>({
    ratePerSec: 0,
    bytesPerSec: 0,
    total: 0,
  });
  const timerRef = useRef<number | null>(null);
  const totalRef = useRef(0);
  const windowRef = useRef<{ at: number; bytes: number }[]>([]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current !== null) return;
    const delay = minInterval + Math.random() * (maxInterval - minInterval);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const msg = sampleNextMessage();
      totalRef.current += 1;
      const now = Date.now();
      windowRef.current.push({ at: now, bytes: msg.bytes });
      // drop entries older than 1s
      windowRef.current = windowRef.current.filter((e) => now - e.at < 1000);
      const ratePerSec = windowRef.current.length;
      const bytesPerSec = windowRef.current.reduce((s, e) => s + e.bytes, 0);
      setStats({ ratePerSec, bytesPerSec, total: totalRef.current });
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > MAX_MESSAGES
          ? next.slice(next.length - MAX_MESSAGES)
          : next;
      });
      if (active) scheduleNext();
    }, delay);
  }, [active, minInterval, maxInterval]);

  useEffect(() => {
    if (active) {
      scheduleNext();
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, scheduleNext]);

  const clear = useCallback(() => {
    setMessages([]);
    setStats({ ratePerSec: 0, bytesPerSec: 0, total: 0 });
    totalRef.current = 0;
    windowRef.current = [];
  }, []);

  const push = useCallback((msg: MqttMessage) => {
    totalRef.current += 1;
    setStats((s) => ({ ...s, total: totalRef.current }));
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES
        ? next.slice(next.length - MAX_MESSAGES)
        : next;
    });
  }, []);

  return { messages, stats, clear, push };
}
