import type { AgvFleet } from "@/types/agv";

/** Ten AGVs from the D_train fleet (num_agvs=10, uniform type profile). */
export const agvFleet: AgvFleet = [
  {
    serial: "agv-001", manufacturer: "meha", label: "AGV-01",
    operatingMode: "EXECUTING",
    position: { x: 12.4, y: 8.1, theta: 0.32 },
    speed: 0.94, batteryCharge: 87, batteryHealth: 98,
    loadState: "LOADED", activeOrderId: "ord-7d3a",
  },
  {
    serial: "agv-002", manufacturer: "meha", label: "AGV-02",
    operatingMode: "EXECUTING",
    position: { x: 4.2, y: 15.7, theta: -1.54 },
    speed: 1.02, batteryCharge: 64, batteryHealth: 96,
    loadState: "LOADED", activeOrderId: "ord-7d3c",
  },
  {
    serial: "agv-003", manufacturer: "meha", label: "AGV-03",
    operatingMode: "IDLE",
    position: { x: 9.8, y: 3.4, theta: 0 },
    speed: 0, batteryCharge: 92, batteryHealth: 99,
    loadState: "EMPTY",
  },
  {
    serial: "agv-004", manufacturer: "meha", label: "AGV-04",
    operatingMode: "EXECUTING",
    position: { x: 18.6, y: 11.2, theta: 2.21 },
    speed: 0.88, batteryCharge: 41, batteryHealth: 94,
    loadState: "LOADED", activeOrderId: "ord-7d3f",
  },
  {
    serial: "agv-005", manufacturer: "meha", label: "AGV-05",
    operatingMode: "CHARGING",
    position: { x: 2.1, y: 2.0, theta: 0 },
    speed: 0, batteryCharge: 18, batteryHealth: 92,
    loadState: "EMPTY",
  },
  {
    serial: "agv-006", manufacturer: "meha", label: "AGV-06",
    operatingMode: "EXECUTING",
    position: { x: 14.9, y: 17.8, theta: 1.05 },
    speed: 0.97, batteryCharge: 73, batteryHealth: 97,
    loadState: "LOADED", activeOrderId: "ord-7d41",
  },
  {
    serial: "agv-007", manufacturer: "meha", label: "AGV-07",
    operatingMode: "EXECUTING",
    position: { x: 7.5, y: 9.9, theta: -0.62 },
    speed: 1.0, batteryCharge: 56, batteryHealth: 95,
    loadState: "LOADED", activeOrderId: "ord-7d42",
  },
  {
    serial: "agv-008", manufacturer: "meha", label: "AGV-08",
    operatingMode: "IDLE",
    position: { x: 11.0, y: 5.5, theta: 0 },
    speed: 0, batteryCharge: 88, batteryHealth: 99,
    loadState: "EMPTY",
  },
  {
    serial: "agv-009", manufacturer: "meha", label: "AGV-09",
    operatingMode: "ERROR",
    position: { x: 16.3, y: 6.8, theta: 0.48 },
    speed: 0, batteryCharge: 32, batteryHealth: 91,
    loadState: "LOADED",
    lastError: "在节点 n_47 处检测到警告距离违规（agv-004 进入安全范围）",
  },
  {
    serial: "agv-010", manufacturer: "meha", label: "AGV-10",
    operatingMode: "EXECUTING",
    position: { x: 5.7, y: 13.1, theta: 2.94 },
    speed: 0.91, batteryCharge: 69, batteryHealth: 96,
    loadState: "LOADED", activeOrderId: "ord-7d45",
  },
];

export const fleetSummary = {
  activeTasks: 6,
  collisions: 1,
  emergencyStops: 0,
  averageBattery: Math.round(
    agvFleet.reduce((s, a) => s + a.batteryCharge, 0) / agvFleet.length,
  ),
  makespan: 412,
};
