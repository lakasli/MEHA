import { useEffect, useState } from "react";
import type {
  E1Row, E7Row,
  MethodLabel, DegradationPoint,
  AblationComponent, GatingMatrix,
} from "@/types/results";

interface E2Payload {
  methods: MethodLabel[];
  points: DegradationPoint[];
}
interface E4Payload {
  distributions: string[];
  components: AblationComponent[];
}
interface E6Payload {
  matrix: GatingMatrix;
  expertRoles: string[];
}
interface E7Payload {
  rows: E7Row[];
  breakdown: { component: string; overhead: number; simagv: string }[];
  tickBudgetMs: number;
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
  return (await r.json()) as T;
}

/** Loads all results tabs in parallel. Each tab fetches lazily on first view. */
export function useExperimentResults() {
  const [e1, setE1] = useState<E1Row[] | null>(null);
  const [e2, setE2] = useState<E2Payload | null>(null);
  const [e4, setE4] = useState<E4Payload | null>(null);
  const [e6, setE6] = useState<E6Payload | null>(null);
  const [e7, setE7] = useState<E7Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r1, r2, r4, r6, r7] = await Promise.all([
        getJson<E1Row[]>("/api/results/e1"),
        getJson<E2Payload>("/api/results/e2"),
        getJson<E4Payload>("/api/results/e4"),
        getJson<E6Payload>("/api/results/e6"),
        getJson<E7Payload>("/api/results/e7"),
      ]);
      setE1(r1); setE2(r2); setE4(r4); setE6(r6); setE7(r7);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  return { e1, e2, e4, e6, e7, loading, error, reload: loadAll };
}
