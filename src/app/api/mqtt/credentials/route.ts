import { NextRequest, NextResponse } from "next/server";
import { getServerT } from "@/lib/i18n-server";

/**
 * Returns MQTT broker credentials for the browser WebSocket client.
 * Credentials are read from server-only env vars (not NEXT_PUBLIC) so they
 * are never embedded in the client bundle.
 * Requires a valid session (middleware injects x-user-id).
 */
export async function GET(req: NextRequest) {
  const t = getServerT(req);
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_EMQX_WS_URL ?? "ws://localhost:8083/mqtt",
    username: process.env.MQTT_CLIENT_USERNAME ?? "client",
    password: process.env.MQTT_CLIENT_PASSWORD ?? "client-mqtt-password",
  });
}
