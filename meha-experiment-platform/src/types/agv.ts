/* AGV fleet types — mirrors the VDA5050 state fields the platform collects. */

export type AgvOperatingMode =
  | "IDLE"
  | "EXECUTING"
  | "CHARGING"
  | "ERROR"
  | "OFFLINE";

export type AgvLoadState = "EMPTY" | "LOADED";

export interface AgvPosition {
  x: number;
  y: number;
  theta: number; // radians
}

export interface AgvStatus {
  /** VDA5050 serial number, e.g. "agv-001". */
  serial: string;
  /** Manufacturer segment of the MQTT topic, e.g. "meha". */
  manufacturer: string;
  /** Friendly label for the card header, e.g. "AGV-01". */
  label: string;
  operatingMode: AgvOperatingMode;
  position: AgvPosition;
  /** m/s */
  speed: number;
  /** 0–100 */
  batteryCharge: number;
  /** 0–100, health of the battery pack. */
  batteryHealth: number;
  loadState: AgvLoadState;
  /** Order id currently being executed, if any. */
  activeOrderId?: string;
  /** Last error text, if operatingMode === "ERROR". */
  lastError?: string;
}

export type AgvFleet = AgvStatus[];

export interface FleetSummary {
  activeTasks: number;
  collisions: number;
  emergencyStops: number;
  averageBattery: number;
  /** seconds, wall-clock since first order dispatched. */
  makespan: number;
}
