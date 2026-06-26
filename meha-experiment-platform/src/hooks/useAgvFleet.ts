import { useEffect, useState } from "react";
import type { AgvFleet, FleetSummary } from "@/types/agv";
import { agvFleet as seedFleet, fleetSummary as seedSummary } from "@/mocks/data/agvFleet";

interface UseAgvFleetReturn {
  fleet: AgvFleet;
  summary: FleetSummary | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the AGV fleet + summary from the mock API. The fleet is also
 * drifted locally every 1.2s so the Monitor panel feels alive — AGVs
 * move, batteries drain, speeds jitter — without needing a backend.
 */
export function useAgvFleet(live: boolean = true): UseAgvFleetReturn {
  const [fleet, setFleet] = useState<AgvFleet>(seedFleet);
  const [summary, setSummary] = useState<FleetSummary | null>(seedSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fr, sr] = await Promise.all([
          fetch("/api/agv-fleet"),
          fetch("/api/agv-fleet/summary"),
        ]);
        if (!fr.ok || !sr.ok) throw new Error("fleet load failed");
        const f = (await fr.json()) as AgvFleet;
        const s = (await sr.json()) as FleetSummary;
        if (cancelled) return;
        setFleet(f);
        setSummary(s);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Local drift — simulates the remote SimAGV3.0 tick publishing new state.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setFleet((prev) =>
        prev.map((a) => {
          if (a.operatingMode !== "EXECUTING") return a;
          const dx = Math.cos(a.position.theta) * a.speed * 0.2;
          const dy = Math.sin(a.position.theta) * a.speed * 0.2;
          return {
            ...a,
            position: {
              x: +(a.position.x + dx).toFixed(2),
              y: +(a.position.y + dy).toFixed(2),
              theta: a.position.theta,
            },
            batteryCharge: Math.max(0, a.batteryCharge - 0.05),
            speed: Math.max(0, +(a.speed + (Math.random() - 0.5) * 0.05).toFixed(2)),
          };
        }),
      );
    }, 1200);
    return () => window.clearInterval(id);
  }, [live]);

  return { fleet, summary, loading, error };
}
