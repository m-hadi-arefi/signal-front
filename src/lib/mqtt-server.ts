import mqtt from "mqtt";
import { logger } from "./logger";

let serverClient: mqtt.MqttClient | null = null;
// Track whether a connection attempt is already in-flight to avoid leaking clients
let isConnecting = false;

function createServerClient(): mqtt.MqttClient {
  const url = process.env.EMQX_WS_URL ?? "ws://localhost:8083/mqtt";
  const client = mqtt.connect(url, {
    username: process.env.EMQX_MQTT_USERNAME ?? "server",
    password: process.env.EMQX_MQTT_PASSWORD ?? "server-password",
    clientId: `server_${Date.now()}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  isConnecting = true;

  client.on("connect", () => {
    isConnecting = false;
    logger.info("mqtt_server_connected", { url });
  });

  client.on("reconnect", () => {
    logger.info("mqtt_server_reconnecting");
  });

  client.on("error", (err) => {
    isConnecting = false;
    logger.error("mqtt_server_error", { error: err.message });
  });

  client.on("offline", () => {
    logger.warn("mqtt_server_offline");
  });

  client.on("close", () => {
    logger.warn("mqtt_server_connection_closed");
  });

  return client;
}

export function getMqttServerClient(): mqtt.MqttClient {
  // `disconnecting` flag means end() was called; create a fresh client in that case.
  if (!serverClient || serverClient.disconnecting) {
    serverClient = createServerClient();
  }
  return serverClient;
}

export async function publishMqttEvent(topic: string, payload: unknown): Promise<void> {
  try {
    const client = getMqttServerClient();

    // Guard: wait for connection if not yet established (up to 8 s)
    if (!client.connected) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("MQTT connection timeout")),
          8000
        );
        const onConnect = () => { clearTimeout(timeout); resolve(); };
        const onError  = (err: Error) => { clearTimeout(timeout); reject(err); };
        client.once("connect", onConnect);
        client.once("error", onError);
      });
    }

    const message = JSON.stringify(payload);
    await new Promise<void>((resolve, reject) => {
      client.publish(topic, message, { qos: 1, retain: false }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info("mqtt_publish", { topic, bytes: message.length });
  } catch (err) {
    logger.error("mqtt_publish_error", {
      topic,
      error: err instanceof Error ? err.message : String(err),
    });
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
