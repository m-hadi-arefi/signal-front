import { NextRequest, NextResponse } from "next/server";

/**
 * EMQX HTTP authentication hook.
 * EMQX POSTs { username, password, clientid } and expects:
 *   { result: "allow" } / { result: "deny" }
 * We accept two fixed identities sourced from env: the server publisher and
 * the read-only web client.
 */
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; clientid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ result: "deny" }, { status: 200 });
  }

  const { username, password } = body;

  const serverUser = process.env.EMQX_MQTT_USERNAME ?? "server";
  const serverPass = process.env.EMQX_MQTT_PASSWORD ?? "server-mqtt-password";
  // MQTT_CLIENT_USERNAME/PASSWORD are server-only vars — never use NEXT_PUBLIC here
  const clientUser = process.env.MQTT_CLIENT_USERNAME ?? "client";
  const clientPass = process.env.MQTT_CLIENT_PASSWORD ?? "client-mqtt-password";

  const allowed =
    (username === serverUser && password === serverPass) ||
    (username === clientUser && password === clientPass);

  return NextResponse.json({ result: allowed ? "allow" : "deny" }, { status: 200 });
}
