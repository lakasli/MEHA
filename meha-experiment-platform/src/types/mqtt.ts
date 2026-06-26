/* MQTT message types — modelled on the VDA5050 topic hierarchy in §0.2. */

export type MqttDirection = "out" | "in";

export type MqttTopicKind =
  | "order"
  | "instantActions"
  | "state"
  | "visualization"
  | "connection";

export interface MqttMessage {
  /** Stable id for React keys. */
  id: string;
  /** Epoch milliseconds when the message was published or received. */
  timestamp: number;
  direction: MqttDirection;
  /** Full topic path, e.g. "uagv/meha/agv-003/order". */
  topic: string;
  topicKind: MqttTopicKind;
  /** 从 topicKind 派生的短标签，例如"订单"、"状态"。 */
  kindLabel: string;
  /** Payload, pretty-printed JSON string. */
  payload: string;
  /** Bytes on the wire, for the rate meter. */
  bytes: number;
}

export interface MqttStreamStats {
  /** Messages per second, rolling window. */
  ratePerSec: number;
  /** Bytes per second, rolling window. */
  bytesPerSec: number;
  /** Total messages observed this session. */
  total: number;
}
