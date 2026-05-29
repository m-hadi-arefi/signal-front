import mqtt, { MqttClient, IClientOptions } from "mqtt";

type MessageHandler = (topic: string, payload: unknown) => void;

class MqttClientManager {
  private client: MqttClient | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private subscriptions = new Set<string>();
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect(): void {
    if (this.client?.connected) return;

    const options: IClientOptions = {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "client",
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "client-password",
      clientId: `web_${Math.random().toString(36).slice(2, 9)}`,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      keepalive: 60,
      clean: true,
    };

    this.client = mqtt.connect(
      process.env.NEXT_PUBLIC_EMQX_WS_URL || "ws://localhost:8083/mqtt",
      options
    );

    this.client.on("connect", () => {
      console.log("[MQTT] Connected");
      this.subscriptions.forEach((topic) => this.client?.subscribe(topic));
    });

    this.client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const handlers = this.handlers.get(topic);
        handlers?.forEach((h) => h(topic, payload));

        const wildcardHandlers = this.handlers.get("#");
        wildcardHandlers?.forEach((h) => h(topic, payload));
      } catch {
        // ignore parse errors
      }
    });

    this.client.on("error", (err) => {
      console.error("[MQTT] Error:", err.message);
    });

    this.client.on("offline", () => {
      console.warn("[MQTT] Offline");
    });
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler);

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.add(topic);
      if (this.client?.connected) this.client.subscribe(topic);
    }

    return () => this.unsubscribe(topic, handler);
  }

  private unsubscribe(topic: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(topic);
        this.subscriptions.delete(topic);
        this.client?.unsubscribe(topic);
      }
    }
  }

  disconnect(): void {
    this.client?.end();
    this.client = null;
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

let instance: MqttClientManager | null = null;

export function getMqttClient(): MqttClientManager {
  if (!instance) instance = new MqttClientManager();
  return instance;
}
