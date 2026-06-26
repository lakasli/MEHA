import type { MqttMessage, MqttTopicKind, MqttDirection } from "@/types/mqtt";

interface SeedMessage {
  direction: MqttDirection;
  topicKind: MqttTopicKind;
  /** Substituted into the topic: uagv/meha/{serial}/{kind}. */
  serial: string;
  payload: object;
}

const kindLabels: Record<MqttTopicKind, string> = {
  order: "订单",
  instantActions: "即时动作",
  state: "状态",
  visualization: "可视化",
  connection: "连接",
};

const seeds: SeedMessage[] = [
  {
    direction: "out", topicKind: "connection", serial: "agv-001",
    payload: { connection: "online", broker: "meha-broker.local:1883" },
  },
  {
    direction: "in", topicKind: "connection", serial: "agv-001",
    payload: { connection: "online", clientId: "agv-001", keepAlive: 60 },
  },
  {
    direction: "out", topicKind: "order", serial: "agv-001",
    payload: {
      orderId: "ord-7d3a", orderUpdateId: 0,
      nodes: [
        { nodeId: "n_312", x: 12.4, y: 8.1, sequenceId: 1, released: true },
        { nodeId: "n_315", x: 13.9, y: 9.0, sequenceId: 2, released: true },
      ],
      edges: [{ edgeId: "e_312-315", startNodeId: "n_312", endNodeId: "n_315" }],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-001",
    payload: {
      serialNumber: "agv-001",
      orderState: "RUNNING",
      agvPosition: { x: 12.4, y: 8.1, theta: 0.32, positionStandard: "B" },
      batteryState: { batteryCharge: 87, batteryHealth: 98, charging: false },
      operatingMode: "EXECUTING",
      actionStates: [{ actionType: "LIFT_UP", actionStatus: "RUNNING" }],
    },
  },
  {
    direction: "out", topicKind: "order", serial: "agv-002",
    payload: {
      orderId: "ord-7d3c", orderUpdateId: 0,
      nodes: [
        { nodeId: "n_204", x: 4.2, y: 15.7, sequenceId: 1, released: true },
        { nodeId: "n_209", x: 5.1, y: 14.2, sequenceId: 2, released: true },
      ],
      edges: [{ edgeId: "e_204-209", startNodeId: "n_204", endNodeId: "n_209" }],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-002",
    payload: {
      serialNumber: "agv-002",
      orderState: "RUNNING",
      agvPosition: { x: 4.2, y: 15.7, theta: -1.54, positionStandard: "B" },
      batteryState: { batteryCharge: 64, batteryHealth: 96, charging: false },
      operatingMode: "EXECUTING",
    },
  },
  {
    direction: "out", topicKind: "instantActions", serial: "agv-005",
    payload: {
      instantActions: [
        { instantActionId: "ia-001", actionType: "initPosition", actionParameters: [] },
      ],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-005",
    payload: {
      serialNumber: "agv-005",
      orderState: "IDLE",
      agvPosition: { x: 2.1, y: 2.0, theta: 0, positionStandard: "B" },
      batteryState: { batteryCharge: 18, batteryHealth: 92, charging: true },
      operatingMode: "CHARGING",
    },
  },
  {
    direction: "in", topicKind: "visualization", serial: "agv-009",
    payload: {
      serialNumber: "agv-009",
      safetyRange: [{ x: 16.0, y: 6.5 }, { x: 16.6, y: 6.5 }, { x: 16.6, y: 7.1 }, { x: 16.0, y: 7.1 }],
      trajectory: [{ x: 16.3, y: 6.8 }, { x: 16.5, y: 6.9 }],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-009",
    payload: {
      serialNumber: "agv-009",
      orderState: "PAUSED",
      agvPosition: { x: 16.3, y: 6.8, theta: 0.48, positionStandard: "B" },
      batteryState: { batteryCharge: 32, batteryHealth: 91, charging: false },
      operatingMode: "ERROR",
      errors: [
        {
          errorType: "warningDistance",
          errorDescription: "agv-004 entered safety range at node n_47",
          errorLevel: "WARNING",
        },
      ],
    },
  },
  {
    direction: "out", topicKind: "order", serial: "agv-003",
    payload: {
      orderId: "ord-7d50", orderUpdateId: 0,
      nodes: [
        { nodeId: "n_88", x: 9.8, y: 3.4, sequenceId: 1, released: true },
        { nodeId: "n_92", x: 11.0, y: 5.5, sequenceId: 2, released: true },
      ],
      edges: [{ edgeId: "e_88-92", startNodeId: "n_88", endNodeId: "n_92" }],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-003",
    payload: {
      serialNumber: "agv-003",
      orderState: "RUNNING",
      agvPosition: { x: 9.8, y: 3.4, theta: 0, positionStandard: "B" },
      batteryState: { batteryCharge: 92, batteryHealth: 99, charging: false },
      operatingMode: "EXECUTING",
    },
  },
  {
    direction: "in", topicKind: "visualization", serial: "agv-004",
    payload: {
      serialNumber: "agv-004",
      safetyRange: [{ x: 18.3, y: 10.9 }, { x: 18.9, y: 10.9 }, { x: 18.9, y: 11.5 }, { x: 18.3, y: 11.5 }],
      trajectory: [{ x: 18.6, y: 11.2 }, { x: 18.7, y: 11.4 }],
    },
  },
  {
    direction: "in", topicKind: "state", serial: "agv-004",
    payload: {
      serialNumber: "agv-004",
      orderState: "RUNNING",
      agvPosition: { x: 18.6, y: 11.2, theta: 2.21, positionStandard: "B" },
      batteryState: { batteryCharge: 41, batteryHealth: 94, charging: false },
      operatingMode: "EXECUTING",
      actionStates: [{ actionType: "LIFT_DOWN", actionStatus: "FINISHED" }],
    },
  },
  {
    direction: "out", topicKind: "order", serial: "agv-010",
    payload: {
      orderId: "ord-7d45", orderUpdateId: 1,
      nodes: [
        { nodeId: "n_511", x: 5.7, y: 13.1, sequenceId: 1, released: true },
        { nodeId: "n_514", x: 6.4, y: 12.0, sequenceId: 2, released: true },
      ],
      edges: [{ edgeId: "e_511-514", startNodeId: "n_511", endNodeId: "n_514" }],
    },
  },
];

let seq = 0;

/** Build a single MqttMessage from a seed, with a stable id and pretty payload. */
export function buildMessage(seed: SeedMessage, at: number = Date.now()): MqttMessage {
  const topic = `uagv/meha/${seed.serial}/${seed.topicKind}`;
  const payload = JSON.stringify(seed.payload, null, 2);
  seq += 1;
  return {
    id: `m-${seq}-${at}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: at,
    direction: seed.direction,
    topic,
    topicKind: seed.topicKind,
    kindLabel: kindLabels[seed.topicKind],
    payload,
    bytes: payload.length,
  };
}

/** Build a batch of seed messages for the initial stream. */
export function buildSeedMessages(): MqttMessage[] {
  const now = Date.now();
  return seeds.map((s, i) => buildMessage(s, now - (seeds.length - i) * 850));
}

/** Sample a single seed and return a fresh message with current timestamp. */
export function sampleNextMessage(): MqttMessage {
  const seed = seeds[Math.floor(Math.random() * seeds.length)];
  return buildMessage(seed, Date.now());
}
