"use client";
import { useEffect, useRef } from "react";
import { getMqttClient } from "@/mqtt/client";

export function useMqtt(topics: string[], onMessage: (topic: string, payload: unknown) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const client = getMqttClient();
    client.connect();

    const unsubs = topics.map((topic) =>
      client.subscribe(topic, (t, payload) => onMessageRef.current(t, payload))
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [topics.join(",")]); // eslint-disable-line
}
