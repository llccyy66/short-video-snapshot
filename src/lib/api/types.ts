// Entity types — mirror the backend's REST/SSE contract (PRD §3).
export type Platform = "bilibili" | "douyin";
export type Level = "brief" | "standard" | "detailed";
export type Density = "off" | "low" | "medium" | "high";
export type Confidence = "high" | "mid" | "low";
export type Provenance = "original" | "paraphrase" | "mixed";

export const LEVEL_LABEL: Record<Level, string> = { brief: "简明", standard: "标准", detailed: "详尽" };
export const DENSITY_LABEL: Record<Density, string> = { off: "不截图", low: "少量", medium: "适中", high: "密集" };
export const CONF_LABEL: Record<Confidence, string> = { high: "高", mid: "中", low: "低" };
export const PROV_LABEL: Record<Provenance, string> = { original: "原创为主", paraphrase: "转述为主", mixed: "原创与转述混合" };

export interface Page<T> {
  items: T[];
  total: number;
  nextCursor: number | null;
}

export interface VideoMeta {
  id: string;
  platform: Platform;
  bvid: string;
  title: string;
  duration: number;
  cover?: string;
  creatorId?: string;
  creatorName?: string;
  publishedAt: string;
  claimCount?: number;
}

export type SummaryBlock =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string; t?: number }
  | { kind: "li"; text: string; t?: number }
  | { kind: "shot"; t: number; url?: string; caption: string };

export interface Segment {
  t: number;
  text: string;
}

export interface JobStage {
  key: string;
  label: string;
  state: "done" | "running" | "pending" | "failed";
  detail?: string;
}

export interface Job {
  id: string;
  kind: "video" | "creator";
  targetId: string;
  status: "running" | "done" | "failed";
  stages: JobStage[];
  progress: number; // 0..1
  done?: number;
  total?: number;
  etaMinutes?: number;
  recent?: string[];
  error?: string;
}

export interface VideoDetail extends VideoMeta {
  jobId?: string;
  ready: boolean;
  density: Density;
  transcriptSource: "subtitle" | "asr";
  frameShotsSupported: boolean;
  summaries: Record<Level, SummaryBlock[]>;
  transcript: Segment[];
}

export interface Creator {
  id: string;
  platform: Platform;
  name: string;
  avatar?: string;
  status: "building" | "ready";
  jobId?: string;
  portrait: string;
  stats: { videos: number; claims: number; deduped: number; motifs: number };
  repeatRate: number;
  originalRate: number;
  paraphraseRate: number;
  concentration: number;
  years: number[];
  fitFor: string[];
  cautions: string[];
}

export interface Evidence {
  quote: string;
  videoId: string;
  videoTitle: string;
  t: number;
  basis: string;
}

export interface Motif {
  id: string;
  name: string;
  thesis: string;
  claimCount: number;
  videoCount: number;
  span: [string, string];
  provenance: Provenance;
  confidence: Confidence;
  timeline: number[]; // counts per year, aligned to Creator.years
  evidence: Evidence[];
}

export interface Claim {
  id: string;
  text: string;
  t: number;
  videoId: string;
  videoTitle: string;
  motifId: string;
  motifName: string;
  paraphrase: boolean;
  clusterId: string;
}

export interface Cluster {
  id: string;
  canonical: string;
  motifName: string;
  count: number;
  videoCount: number;
  variants: Claim[];
}

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  platform: Platform;
  level: Level;
  at: string;
}

export type AskScope = { kind: "video" | "creator"; id: string; label: string };

export interface Citation {
  n: number;
  videoId: string;
  videoTitle: string;
  t: number;
  quote: string;
}

export type AskEvent =
  | { type: "token"; text: string }
  | { type: "citation"; citation: Citation }
  | { type: "done"; grounded: boolean };

export interface StartOptions {
  url: string;
  level: Level;
  density: Density;
}

/** The data layer the views depend on. Mock and HTTP implementations share this. */
export interface Api {
  listCreators(): Promise<Creator[]>;
  getCreator(id: string): Promise<Creator>;
  listMotifs(creatorId: string): Promise<Motif[]>;
  listVideos(creatorId: string, cursor: number): Promise<Page<VideoMeta>>;
  listClaimsByVideo(creatorId: string, cursor: number): Promise<Page<{ video: VideoMeta; claims: Claim[] }>>;
  listClusters(creatorId: string, cursor: number, mode: "repeat" | "all"): Promise<Page<Cluster>>;
  listVideoClaims(videoId: string): Promise<Claim[]>;
  getVideo(id: string): Promise<VideoDetail>;
  getJob(id: string): Promise<Job>;
  retryJob(id: string): Promise<Job>;
  startVideo(opts: StartOptions & { id: string }): Promise<{ videoId: string }>;
  startCreator(opts: { url: string; id: string }): Promise<{ creatorId: string }>;
  listHistory(cursor: number): Promise<Page<HistoryItem>>;
  deleteHistory(id: string): Promise<void>;
  ask(scope: AskScope, question: string, signal?: AbortSignal): AsyncGenerator<AskEvent>;
}
