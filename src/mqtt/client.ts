import mqtt, { MqttClient, IClientOptions } from "mqtt";

type MessageHandler = (topic: string, payload: unknown) => void;

interface MqttCredentials {
  url: string;
  username: string;
  password: string;
}

class MqttClientManager {
  private client: MqttClient | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private subscriptions = new Set<string>();
  // Prevent duplicate connect calls while a connection is in-flight
  private connecting = false;

  /** Fetch broker credentials from the server so they are never in the client bundle. */
  private async fetchCredentials(): Promise<MqttCredentials> {
    const res = await fetch("/api/mqtt/credentials");
    if (!res.ok) throw new Error("[MQTT] Failed to fetch credentials");
    return res.json() as Promise<MqttCredentials>;
  }

  async connect(): Promise<void> {
    if (this.client?.connected || this.connecting) return;
    this.connecting = true;

    let creds: MqttCredentials;
    try {
      creds = await this.fetchCredentials();
    } catch (err) {
      console.error("[MQTT] Credential fetch error:", err);
      this.connecting = false;
      return;
    }

    const options: IClientOptions = {
      username: creds.username,
      password: creds.password,
      clientId: `web_${Math.random().toString(36).slice(2, 9)}`,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      keepalive: 60,
      clean: true,
    };

    this.client = mqtt.connect(creds.url, options);

    this.client.on("connect", () => {
      console.log("[MQTT] Connected");
      this.connecting = false;
      // Re-subscribe to all tracked topics after (re)connect
      this.subscriptions.forEach((topic) => this.client?.subscribe(topic));
    });

    this.client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        this.handlers.get(topic)?.forEach((h) => h(topic, payload));
        this.handlers.get("#")?.forEach((h) => h(topic, payload));

        // Show browser notification when app is not visible
        if (
          typeof document !== "undefined" &&
          document.visibilityState === "hidden" &&
          topic.includes("signal:new") &&
          "serviceWorker" in navigator &&
          Notification.permission === "granted"
        ) {
          const title = (payload as { symbol?: string }).symbol
            ? `New ${(payload as { symbol: string }).symbol} Signal`
            : "New Signal";
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body: (payload as { aiSummary?: string }).aiSummary ?? "A new crypto signal was posted",
              icon: "/icon-192.png",
              tag: `signal-${(payload as { id?: string }).id ?? Date.now()}`,
              data: { url: `/signals/${(payload as { id?: string }).id ?? ""}` },
            });
          }).catch(() => {/* ignore */});
        }
      } catch {
        // Malformed JSON — ignore silently (not a security issue)
      }
    });

    this.client.on("error", (err) => {
      console.error("[MQTT] Error:", err.message);
      this.connecting = false;
    });

    this.client.on("offline", () => {
      console.warn("[MQTT] Offline — reconnecting…");
    });
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler);

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.add(topic);
      // Guard: only call subscribe when connection is confirmed
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
    this.connecting = false;
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
