export type Role = "MEMBER" | "ANALYST" | "ADMIN";
export type Direction = "LONG" | "SHORT" | "NEUTRAL";
export type EntryType = "MARKET" | "LIMIT" | "STOP";
export type SignalStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type ScenarioStatus = "ACTIVE" | "INVALIDATED" | "HIT_TP" | "HIT_SL";

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

export interface ScenarioData {
  id: string;
  direction: Direction;
  entryPoint: number;
  entryType: EntryType;
  takeProfits: number[];
  stopLoss: number;
  invalidation: string | null;
  confidence: number;
  reasoning: string;
  status: ScenarioStatus;
  raw: string | null;
  createdAt: string;
  result?: ScenarioResultData | null;
}

export interface ScenarioResultData {
  id: string;
  result: string;
  pnlPercent: number | null;
  hitTp: number | null;
  hitSl: boolean;
  maxDrawdown: number | null;
  evaluatedAt: string;
}

export interface SignalData {
  id: string;
  symbol: string;
  rawText: string;
  aiSummary: string | null;
  currentMarketPrice: number | null;
  source: string | null;
  status: SignalStatus;
  createdAt: string;
  analyzedAt: string | null;
  author: UserPublic;
  scenarios: ScenarioData[];
  _count?: { comments: number; likes: number };
  isLiked?: boolean;
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
