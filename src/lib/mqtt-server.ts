import mqtt from "mqtt";
import { logger } from "./logger";

let serverClient: mqtt.MqttClient | null = null;

export function getMqttServerClient(): mqtt.MqttClient {
  if (!serverClient || !serverClient.connected) {
    serverClient = mqtt.connect(process.env.EMQX_WS_URL || "ws://localhost:8083/mqtt", {
      username: process.env.EMQX_MQTT_USERNAME || "server",
      password: process.env.EMQX_MQTT_PASSWORD || "server-password",
      clientId: `server_${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    serverClient.on("error", (err) => {
      console.error("[MQTT Server] Error:", err.message);
    });
  }
  return serverClient;
}

export async function publishMqttEvent(topic: string, payload: unknown): Promise<void> {
  try {
    const client = getMqttServerClient();
    const message = JSON.stringify(payload);
    await new Promise<void>((resolve, reject) => {
      client.publish(topic, message, { qos: 1, retain: false }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info("mqtt_publish", { topic, bytes: message.length });
  } catch (err) {
    logger.error("mqtt_publish_error", { topic, error: err instanceof Error ? err.message : String(err) });
  }
}

export const MQTT_TOPICS = {
  SIGNALS_GLOBAL: "signals/global",
  SIGNALS_SYMBOL: (symbol: string) => `signals/symbol/${symbol}`,
  SIGNAL_DETAIL: (signalId: string) => `signals/${signalId}`,
  COMMENTS: (signalId: string) => `comments/${signalId}`,
  PROFILE: (userId: string) => `profiles/${userId}`,
  NOTIFICATIONS: (userId: string) => `notifications/${userId}`,
} as const;
