export type Role = "MEMBER" | "ANALYST" | "ADMIN";
export type Direction = "LONG" | "SHORT" | "NEUTRAL";
export type EntryType = "MARKET" | "LIMIT" | "STOP" | "FIX";
export type SignalStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type ScenarioStatus = "ACTIVE" | "RUNNING" | "CANCELLED" | "INVALIDATED" | "HIT_TP" | "HIT_SL";

export interface UserPublic {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: Role;
  createdAt: string;
  _count?: { signals: number; likes: number; followers?: number; following?: number };
  isFollowing?: boolean;
  isSelf?: boolean;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  pnl_percent: number;
}

export interface SignalEvent {
  timestamp: string;
  event_type: string;
  description: string;
  price: number | null;
}

export interface ScenarioPerformanceData {
  id: string;
  activationTime: string | null;
  activationPrice: number | null;
  signalAgeSeconds: number | null;
  isProfit: boolean;
  isLoss: boolean;
  statusPercentNow: string | null;
  highestPriceReached: number | null;
  lowestPriceReached: number | null;
  maxProfitPercent: string | null;
  maxDrawdownPercent: string | null;
  targetsHit: unknown[];
  targetsHitAt: unknown[];
  stopLossHit: boolean;
  stopLossHitAt: string | null;
  targetsCompletedCount: number;
  totalTargetsCount: number;
  successProgressPercent: number | null;
  priceHistory: PricePoint[];
  eventHistory: SignalEvent[];
}

export interface ScenarioData {
  id: string;
  externalId?: number | null;
  direction: Direction;
  entryPoint?: number | null;
  entryType: EntryType;
  takeProfits: number[];
  stopLoss?: number | null;
  invalidation?: string | null;
  confidence?: number | null;
  reasoning: string;
  status: ScenarioStatus;
  active: boolean;
  expiresAt?: string | null;
  raw?: string | null;
  createdAt: string;
  performance?: ScenarioPerformanceData | null;
}

export interface SignalSource {
  type?: string;
  channel?: string;
  provider?: string;
  message_id?: number;
}

export interface SignalData {
  id: string;
  symbol: string;
  rawText?: string | null;
  aiSummary?: string | null;
  latestPrice?: number | null;
  createdPrice?: number | null;
  active: boolean;
  activeExternalScenarioId?: number | null;
  source?: SignalSource | string | null;
  status: SignalStatus;
  fromService: boolean;
  createdAt: string;
  analyzedAt?: string | null;
  author: UserPublic;
  scenarios: ScenarioData[];
  _count?: { comments: number; likes: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: UserPublic;
  parentId: string | null;
  replies?: CommentData[];
  _count?: { likes: number };
  isLiked?: boolean;
}

export interface MqttEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  total?: number;
}
