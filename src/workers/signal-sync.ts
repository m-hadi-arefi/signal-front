import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import bcrypt from "bcryptjs";

const log = {
  info: (msg: string, fields?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", message: msg, timestamp: new Date().toISOString(), ...fields })),
  warn: (msg: string, fields?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", message: msg, timestamp: new Date().toISOString(), ...fields })),
  error: (msg: string, fields?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", message: msg, timestamp: new Date().toISOString(), ...fields })),
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SIGNAL_API_URL = process.env.SIGNAL_API_URL ?? "http://localhost:8080";
const PAGE_SIZE = parseInt(process.env.SIGNAL_API_PAGE_SIZE ?? "20", 10);
const INTERVAL_MS = parseInt(process.env.SIGNAL_SYNC_INTERVAL_MS ?? "10000", 10);
const MAX_INITIAL_PAGES = parseInt(process.env.SIGNAL_MAX_INITIAL_PAGES ?? "5", 10);

interface ExternalSource {
  type?: string;
  channel?: string;
  provider?: string;
  message_id?: number;
}

interface ExternalTakeProfit {
  price: number;
}

interface ExternalPricePoint {
  timestamp: string;
  price: number;
  pnl_percent: number;
}

interface ExternalEvent {
  timestamp: string;
  event_type: string;
  description: string;
  price: number | null;
}

interface ExternalPerformance {
  activation_time: string | null;
  activation_price: number | null;
  signal_age_seconds: number;
  is_profit: boolean;
  is_loss: boolean;
  status_percent_now: string | null;
  highest_price_reached: number | null;
  lowest_price_reached: number | null;
  max_profit_percent: string | null;
  max_drawdown_percent: string | null;
  targets_hit: unknown[];
  targets_hit_at: unknown[];
  stop_loss_hit: boolean;
  stop_loss_hit_at: string | null;
  targets_completed_count: number;
  total_targets_count: number;
  success_progress_percent: number | null;
  price_history: ExternalPricePoint[];
  event_history: ExternalEvent[];
}

interface ExternalScenario {
  id: number;
  direction: string;
  entry: string;
  entry_type: string;
  take_profits: ExternalTakeProfit[];
  reasoning: string;
  status: string;
  active: boolean;
  expires_at: string | null;
  performance: ExternalPerformance;
}

interface ExternalSignal {
  id: number;
  symbol: string;
  trace_id: string;
  source: ExternalSource;
  ai_summary?: string;
  created_at: string;
  analyzed_at: string;
  active: boolean;
  status: string;
  latest_price: number;
  created_price: number;
  active_scenarios_id: number | null;
  scenarios: ExternalScenario[];
}

interface ExternalApiResponse {
  data: ExternalSignal[];
  meta: { page: number; limit: number; total: number };
}

function mapDirection(dir: string): "LONG" | "SHORT" | "NEUTRAL" {
  const d = dir.toLowerCase();
  if (d === "long") return "LONG";
  if (d === "short") return "SHORT";
  return "NEUTRAL";
}

function mapEntryType(et: string): "MARKET" | "LIMIT" | "STOP" | "FIX" {
  const e = et.toLowerCase();
  if (e === "fix" || e === "fixed") return "FIX";
  if (e.includes("break") || e.includes("stop")) return "STOP";
  if (e.includes("market")) return "MARKET";
  return "LIMIT";
}

function mapScenarioStatus(status: string): "ACTIVE" | "RUNNING" | "CANCELLED" | "INVALIDATED" | "HIT_TP" | "HIT_SL" {
  switch (status.toLowerCase()) {
    case "active": return "ACTIVE";
    case "running": return "RUNNING";
    case "success": case "hit_tp": return "HIT_TP";
    case "failed": case "hit_sl": return "HIT_SL";
    case "cancelled": case "expired": case "skipped": return "CANCELLED";
    case "invalid": case "rejected": case "invalidated": return "INVALIDATED";
    default: return "ACTIVE";
  }
}

function mapSignalStatus(status: string): "OPEN" | "CLOSED" | "CANCELLED" {
  switch (status.toLowerCase()) {
    case "closed": case "completed": return "CLOSED";
    case "cancelled": return "CANCELLED";
    default: return "OPEN";
  }
}

async function resolveSystemUser(): Promise<string> {
  const envId = process.env.SIGNAL_SERVICE_USER_ID;
  if (envId) {
    const user = await prisma.user.findUnique({ where: { id: envId }, select: { id: true } });
    if (user) return user.id;
    log.warn("signal_worker_env_user_not_found", { envId });
  }

  const existing = await prisma.user.findUnique({ where: { username: "signal-service" }, select: { id: true } });
  if (existing) return existing.id;

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  const created = await prisma.user.create({
    data: { email: "signal-service@system.internal", username: "signal-service", passwordHash, role: "ADMIN" },
    select: { id: true },
  });
  log.info("signal_worker_system_user_created", { id: created.id });
  return created.id;
}

async function fetchPage(page: number): Promise<ExternalApiResponse | null> {
  const url = `${SIGNAL_API_URL}/v1/signals?page=${page}&limit=${PAGE_SIZE}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    log.error("signal_worker_fetch_failed", { url, status: res.status });
    return null;
  }
  return res.json() as Promise<ExternalApiResponse>;
}

function buildPerformanceData(perf: ExternalPerformance) {
  return {
    activationTime: perf.activation_time ? new Date(perf.activation_time) : null,
    activationPrice: perf.activation_price ?? null,
    signalAgeSeconds: perf.signal_age_seconds,
    isProfit: perf.is_profit,
    isLoss: perf.is_loss,
    statusPercentNow: perf.status_percent_now ?? null,
    highestPriceReached: perf.highest_price_reached ?? null,
    lowestPriceReached: perf.lowest_price_reached ?? null,
    maxProfitPercent: perf.max_profit_percent ?? null,
    maxDrawdownPercent: perf.max_drawdown_percent ?? null,
    targetsHit: (perf.targets_hit ?? []) as unknown as Prisma.InputJsonValue,
    targetsHitAt: (perf.targets_hit_at ?? []) as unknown as Prisma.InputJsonValue,
    stopLossHit: perf.stop_loss_hit,
    stopLossHitAt: perf.stop_loss_hit_at ? new Date(perf.stop_loss_hit_at) : null,
    targetsCompletedCount: perf.targets_completed_count,
    totalTargetsCount: perf.total_targets_count,
    successProgressPercent: perf.success_progress_percent ?? null,
    priceHistory: (perf.price_history ?? []) as unknown as Prisma.InputJsonValue,
    eventHistory: (perf.event_history ?? []) as unknown as Prisma.InputJsonValue,
  };
}

async function upsertSignal(item: ExternalSignal, systemUserId: string): Promise<boolean> {
  const existing = await prisma.signal.findUnique({
    where: { traceId: item.trace_id },
    select: { id: true, scenarios: { select: { id: true, externalId: true } } },
  });

  if (existing) {
    // Update dynamic fields and performance for each scenario
    await prisma.signal.update({
      where: { id: existing.id },
      data: {
        latestPrice: item.latest_price,
        active: item.active,
        activeExternalScenarioId: item.active_scenarios_id ?? null,
        status: mapSignalStatus(item.status),
      },
    });

    for (const extScenario of item.scenarios) {
      const localScenario = existing.scenarios.find((s) => s.externalId === extScenario.id);
      if (!localScenario) continue;

      await prisma.scenario.update({
        where: { id: localScenario.id },
        data: {
          status: mapScenarioStatus(extScenario.status),
          active: extScenario.active,
        },
      });

      await prisma.scenarioPerformance.upsert({
        where: { scenarioId: localScenario.id },
        update: buildPerformanceData(extScenario.performance),
        create: { scenarioId: localScenario.id, ...buildPerformanceData(extScenario.performance) },
      });
    }
    return false;
  }

  // Create new signal
  const created = await prisma.signal.create({
    data: {
      symbol: item.symbol.toUpperCase(),
      traceId: item.trace_id,
      source: item.source as object,
      fromService: true,
      externalId: item.id,
      latestPrice: item.latest_price,
      createdPrice: item.created_price,
      active: item.active,
      activeExternalScenarioId: item.active_scenarios_id ?? null,
      authorId: systemUserId,
      status: mapSignalStatus(item.status),
      createdAt: new Date(item.created_at),
      analyzedAt: item.analyzed_at ? new Date(item.analyzed_at) : null,
      scenarios: {
        create: item.scenarios.map((s) => {
          const entryNum = parseFloat(s.entry);
          return {
            externalId: s.id,
            direction: mapDirection(s.direction),
            entryPoint: isNaN(entryNum) ? null : entryNum,
            entryType: mapEntryType(s.entry_type),
            takeProfits: s.take_profits ? s.take_profits.map((tp) => tp.price) : [],
            reasoning: s.reasoning ?? "",
            status: mapScenarioStatus(s.status),
            active: s.active,
            expiresAt: s.expires_at ? new Date(s.expires_at) : null,
          };
        }),
      },
    },
    select: {
      id: true,
      symbol: true,
      latestPrice: true,
      source: true,
      status: true,
      fromService: true,
      createdAt: true,
      author: { select: { id: true, username: true, avatar: true, role: true, bio: true, createdAt: true } },
      scenarios: { select: { id: true, externalId: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  // Create performance for each scenario
  for (const extScenario of item.scenarios) {
    const localScenario = created.scenarios.find((s) => s.externalId === extScenario.id);
    if (!localScenario) continue;
    await prisma.scenarioPerformance.create({
      data: { scenarioId: localScenario.id, ...buildPerformanceData(extScenario.performance) },
    });
  }

  const payload = {
    type: "NEW_SIGNAL",
    payload: {
      ...created,
      createdAt: created.createdAt.toISOString(),
      author: { ...created.author, createdAt: created.author.createdAt.toISOString() },
      isLiked: false,
    },
  };

  await publishMqttEvent(MQTT_TOPICS.SIGNALS_GLOBAL, payload);
  await publishMqttEvent(MQTT_TOPICS.SIGNALS_SYMBOL(created.symbol), payload);
  return true;
}

async function syncSignals(systemUserId: string): Promise<void> {
  const lastImported = await prisma.signal.aggregate({
    where: { fromService: true, externalId: { not: null } },
    _max: { externalId: true },
  });
  const lastKnownId = lastImported._max.externalId ?? 0;
  const isFirstRun = lastKnownId === 0;

  const toProcess: ExternalSignal[] = [];
  const maxPages = isFirstRun ? MAX_INITIAL_PAGES : 3;

  for (let page = 1; page <= maxPages; page++) {
    const resp = await fetchPage(page);
    if (!resp || resp.data.length === 0) break;

    let foundOldNew = false;
    for (const item of resp.data) {
      toProcess.push(item);
      if (!isFirstRun && item.id <= lastKnownId) { foundOldNew = true; }
    }

    const totalPages = Math.ceil(resp.meta.total / PAGE_SIZE);
    if (foundOldNew || page >= totalPages) break;
  }

  if (toProcess.length === 0) return;

  toProcess.sort((a, b) => a.id - b.id);

  let created = 0;
  let updated = 0;
  for (const item of toProcess) {
    const isNew = await upsertSignal(item, systemUserId);
    if (isNew) created++; else updated++;
  }

  if (created > 0 || updated > 0) {
    log.info("signal_worker_sync_complete", { created, updated });
  }
}

async function main() {
  log.info("signal_worker_starting", { intervalMs: INTERVAL_MS });

  const systemUserId = await resolveSystemUser();
  log.info("signal_worker_ready", { systemUserId });

  let running = true;

  const runOnce = async () => {
    try {
      await syncSignals(systemUserId);
    } catch (err) {
      log.error("signal_worker_sync_error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  await runOnce();
  const timer = setInterval(runOnce, INTERVAL_MS);

  const shutdown = async () => {
    if (!running) return;
    running = false;
    clearInterval(timer);
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 500);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  log.error("signal_worker_fatal", { error: String(err) });
  process.exit(1);
});
