// @ts-nocheck -- mock-only generator; strict index checks add noise here
// In-browser mock backend. State persists in localStorage so jobs survive refresh/leaving.
import { genCreator, genVideoContent, hash, rng, standaloneMeta, PROFILES, fakeBvid, BANK } from "./mock-data";
import type { Api, AskEvent, AskScope, Claim, Creator, HistoryItem, Job, JobStage, Level, Density, Page, VideoDetail, VideoMeta } from "./types";

const PAGE = 20;
const KEY = "zbili.mock.v1";

interface StartedVideo { id: string; platform: "bilibili" | "douyin"; level: Level; density: Density; startedAt: number; url: string }
interface StartedCreator { id: string; platform: "bilibili" | "douyin"; name: string; total: number; startedAt: number }
interface Store { videos: Record<string, StartedVideo>; creators: Record<string, StartedCreator>; history: HistoryItem[] }

const VIDEO_JOB_MS = 9000;
const ENUM_S = 120, PER_VIDEO_S = 75, POST_S = 600;

function load(): Store {
  if (typeof localStorage === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  const s = seed();
  save(s);
  return s;
}
function save(s: Store) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}
function seed(): Store {
  const c = genCreator("bili-up-1001")!;
  const now = Date.now();
  const history: HistoryItem[] = [3, 18, 41, 77].map((n, i) => {
    const v = c.videos[c.videos.length - n];
    return { id: `h-${v.id}-standard`, videoId: v.id, title: v.title, platform: v.platform, level: (["standard", "detailed", "brief", "standard"] as Level[])[i], at: new Date(now - (i + 1) * 5.3e6).toISOString() };
  });
  return {
    videos: {},
    creators: { "bili-up-2002": { id: "bili-up-2002", platform: "bilibili", name: "阿哲说职场", total: 128, startedAt: now - 47 * 60000 } },
    history,
  };
}

const wait = (ms = 120 + Math.random() * 240) => new Promise((r) => setTimeout(r, ms));
function paginate<T>(arr: T[], cursor: number, size = PAGE): Page<T> {
  const items = arr.slice(cursor, cursor + size);
  return { items, total: arr.length, nextCursor: cursor + size < arr.length ? cursor + size : null };
}
function notFound(what: string): never {
  throw new Error(`${what}不存在或已被删除`);
}

function videoJob(v: StartedVideo, transcriptAsr: boolean): Job {
  const el = Date.now() - v.startedAt;
  const marks = [1500, 4500, 8000, VIDEO_JOB_MS];
  const defs: [string, string, string?][] = [
    ["fetch", "获取视频信息"],
    ["transcript", "获取口播稿", transcriptAsr ? "未找到字幕，已自动改用语音识别" : "已获取平台字幕"],
    ["summary", "生成三档总结"],
    ["shots", "抽取关键帧", v.platform === "douyin" ? "抖音抽帧即将支持，已使用图文配图" : v.density === "off" ? "已按设置跳过" : undefined],
  ];
  const stages: JobStage[] = defs.map(([key, label, detail], i) => ({
    key, label,
    state: el >= marks[i] ? "done" : el >= (marks[i - 1] ?? 0) ? "running" : "pending",
    detail: el >= (marks[i - 1] ?? 0) ? detail : undefined,
  }));
  const done = el >= VIDEO_JOB_MS;
  return { id: `job-${v.id}`, kind: "video", targetId: v.id, status: done ? "done" : "running", stages, progress: Math.min(1, el / VIDEO_JOB_MS) };
}

function creatorJob(c: StartedCreator): Job {
  const el = (Date.now() - c.startedAt) / 1000;
  const total = ENUM_S + c.total * PER_VIDEO_S + POST_S * 4;
  const doneVideos = Math.max(0, Math.min(c.total, Math.floor((el - ENUM_S) / PER_VIDEO_S)));
  const pipeEnd = ENUM_S + c.total * PER_VIDEO_S;
  const st = (from: number, to: number): JobStage["state"] => (el >= to ? "done" : el >= from ? "running" : "pending");
  const stages: JobStage[] = [
    { key: "enum", label: "枚举全部视频", state: st(0, ENUM_S), detail: el >= ENUM_S ? `共 ${c.total} 个视频` : undefined },
    { key: "transcript", label: "逐个获取口播稿", state: st(ENUM_S, pipeEnd), detail: `${doneVideos}/${c.total}` },
    { key: "summary", label: "逐个总结", state: st(ENUM_S + 30, pipeEnd), detail: `${doneVideos}/${c.total}` },
    { key: "claims", label: "抽取观点", state: st(ENUM_S + 60, pipeEnd), detail: `已抽取 ${doneVideos * 11} 条` },
    { key: "dedup", label: "观点去重", state: st(pipeEnd, pipeEnd + POST_S) },
    { key: "cluster", label: "母题聚类", state: st(pipeEnd + POST_S, pipeEnd + POST_S * 2) },
    { key: "source", label: "溯源判断", state: st(pipeEnd + POST_S * 2, pipeEnd + POST_S * 3) },
    { key: "report", label: "生成档案", state: st(pipeEnd + POST_S * 3, total) },
  ];
  const r = rng(hash(c.id));
  const recent = Array.from({ length: Math.min(4, doneVideos) }, (_, i) => `#${doneVideos - i} ${BANK[Math.floor(r() * BANK.length)].titles[0]}`);
  return {
    id: `job-${c.id}`, kind: "creator", targetId: c.id, status: el >= total ? "done" : "running", stages,
    progress: Math.min(1, el / total), done: doneVideos, total: c.total, etaMinutes: Math.max(0, (total - el) / 60), recent,
  };
}

function creatorVideoMeta(id: string): VideoMeta | null {
  const m = id.match(/^(.*)-v(\d+)$/);
  if (!m) return null;
  const data = genCreator(m[1]);
  const v = data?.videos[Number(m[2]) - 1];
  if (!v) return null;
  const { motif: _m, ...meta } = v as VideoMeta & { motif?: number };
  return { ...meta, claimCount: data!.byVideo.get(id)?.length ?? 0 };
}

function buildingCreator(c: StartedCreator): Creator {
  return {
    id: c.id, platform: c.platform, name: c.name, status: "building", jobId: `job-${c.id}`,
    portrait: "", stats: { videos: c.total, claims: 0, deduped: 0, motifs: 0 },
    repeatRate: 0, originalRate: 0, paraphraseRate: 0, concentration: 0, years: [], fitFor: [], cautions: [],
  };
}

function bigrams(s: string) {
  const clean = s.replace(/[\s，。？?！!、：:；;""'"（）()]/g, "").replace(/(他|她|这个|博主|视频|怎么|什么|为什么|是不是|吗|呢|的|了|有|和|对|在|是|讲|说|看)/g, "|");
  const out = new Set<string>();
  for (const part of clean.split("|")) for (let i = 0; i < part.length - 1; i++) out.add(part.slice(i, i + 2));
  return out;
}

export const mockApi: Api = {
  async listCreators() {
    await wait();
    const s = load();
    const ready = Object.keys(PROFILES).map((id) => genCreator(id)!.creator);
    const building = Object.values(s.creators).map((c) => (creatorJob(c).status === "done" && PROFILES[c.id] ? genCreator(c.id)!.creator : buildingCreator(c)));
    return [...building, ...ready];
  },
  async getCreator(id) {
    await wait();
    const s = load();
    if (s.creators[id]) return buildingCreator(s.creators[id]);
    return genCreator(id)?.creator ?? notFound("档案");
  },
  async listMotifs(id) {
    await wait();
    return genCreator(id)?.motifs ?? [];
  },
  async listVideos(id, cursor) {
    await wait();
    const s = load();
    const bc = s.creators[id];
    if (bc) {
      const j = creatorJob(bc);
      const r = rng(hash(id));
      const vids: VideoMeta[] = Array.from({ length: j.done ?? 0 }, (_, i) => ({
        id: `${id}-p${i + 1}`, platform: bc.platform, bvid: fakeBvid(r), title: BANK[Math.floor(r() * BANK.length)].titles[i % 3], duration: Math.floor(300 + r() * 1500), publishedAt: new Date(Date.now() - (i + 1) * 4e8).toISOString(), creatorId: id, creatorName: bc.name,
      }));
      return paginate(vids.reverse(), cursor);
    }
    const d = genCreator(id) ?? notFound("档案");
    const list = [...d.videos].reverse().map((v) => ({ ...v, claimCount: d.byVideo.get(v.id)?.length ?? 0 }));
    return paginate(list, cursor);
  },
  async listClaimsByVideo(id, cursor) {
    await wait();
    const d = genCreator(id) ?? notFound("档案");
    const vids = [...d.videos].reverse().filter((v) => d.byVideo.has(v.id));
    const page = paginate(vids, cursor, 8);
    return { ...page, items: page.items.map((video) => ({ video, claims: d.byVideo.get(video.id)! })) };
  },
  async listClusters(id, cursor, mode) {
    await wait();
    const d = genCreator(id) ?? notFound("档案");
    const list = mode === "repeat" ? d.clusters.filter((c) => c.count > 1).sort((a, b) => b.count - a.count) : d.clusters;
    return paginate(list, cursor, 15);
  },
  async listVideoClaims(videoId) {
    await wait();
    const m = videoId.match(/^(.*)-v(\d+)$/);
    return (m && genCreator(m[1])?.byVideo.get(videoId)) || [];
  },
  async getVideo(id) {
    await wait();
    const s = load();
    const started = s.videos[id];
    const platform = id.startsWith("dy") ? "douyin" : "bilibili";
    const meta = creatorVideoMeta(id) ?? standaloneMeta(id, platform);
    const asr = hash(id) % 3 === 0;
    const density: Density = started?.density ?? "medium";
    const frameShotsSupported = meta.platform === "bilibili";
    const claims = creatorVideoMeta(id) ? genCreator(id.replace(/-v\d+$/, ""))!.byVideo.get(id) ?? [] : [];
    const content = genVideoContent(meta, claims.map((c) => ({ text: c.text, t: c.t })), density, frameShotsSupported);
    const job = started ? videoJob(started, asr) : null;
    const detail: VideoDetail = {
      ...meta, ...content, density, frameShotsSupported,
      transcriptSource: asr ? "asr" : "subtitle",
      ready: !job || job.status === "done",
      jobId: job && job.status !== "done" ? job.id : undefined,
    };
    return detail;
  },
  async getJob(id) {
    await wait(80);
    const s = load();
    const target = id.replace(/^job-/, "");
    if (s.videos[target]) return videoJob(s.videos[target], hash(target) % 3 === 0);
    if (s.creators[target]) return creatorJob(s.creators[target]);
    return notFound("任务");
  },
  async retryJob(id) {
    const s = load();
    const target = id.replace(/^job-/, "");
    if (s.videos[target]) s.videos[target].startedAt = Date.now();
    save(s);
    return this.getJob(id);
  },
  async startVideo({ id, url, level, density }) {
    await wait();
    const s = load();
    const platform = id.startsWith("dy") ? "douyin" : "bilibili";
    s.videos[id] = { id, platform, level, density, startedAt: Date.now(), url };
    const meta = creatorVideoMeta(id) ?? standaloneMeta(id, platform);
    const hid = `h-${id}-${level}`;
    s.history = [{ id: hid, videoId: id, title: meta.title, platform, level, at: new Date().toISOString() }, ...s.history.filter((h) => h.id !== hid)];
    save(s);
    return { videoId: id };
  },
  async startCreator({ id }) {
    await wait();
    const s = load();
    if (PROFILES[id] || s.creators[id]) return { creatorId: id };
    const r = rng(hash(id));
    s.creators[id] = { id, platform: id.startsWith("dy") ? "douyin" : "bilibili", name: id.startsWith("dy") ? "抖音博主" : `UP主 ${id.replace("bili-up-", "")}`, total: 60 + Math.floor(r() * 240), startedAt: Date.now() };
    save(s);
    return { creatorId: id };
  },
  async listHistory(cursor) {
    await wait();
    return paginate(load().history, cursor);
  },
  async deleteHistory(id) {
    await wait();
    const s = load();
    s.history = s.history.filter((h) => h.id !== id);
    save(s);
  },
  async *ask(scope: AskScope, question: string, signal?: AbortSignal): AsyncGenerator<AskEvent> {
    await wait(400);
    let pool: Claim[] = [];
    if (scope.kind === "creator") pool = genCreator(scope.id)?.claims ?? [];
    else {
      const m = scope.id.match(/^(.*)-v(\d+)$/);
      pool = (m && genCreator(m[1])?.byVideo.get(scope.id)) || [];
      if (!pool.length) {
        const v = await this.getVideo(scope.id);
        pool = v.transcript.map((seg, i) => ({ id: `t${i}`, text: seg.text, t: seg.t, videoId: v.id, videoTitle: v.title, motifId: "", motifName: "", paraphrase: false, clusterId: `t${i}` }));
      }
    }
    const q = bigrams(question);
    const scored = pool
      .map((c) => {
        let n = 0;
        q.forEach((b) => { if (c.text.includes(b) || c.motifName.includes(b)) n++; });
        return { c, n };
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);
    const seen = new Set<string>();
    const picks = scored.filter((x) => (seen.has(x.c.clusterId) ? false : (seen.add(x.c.clusterId), true))).slice(0, 3).map((x) => x.c);
    let text: string;
    if (!picks.length) {
      text = `在${scope.kind === "creator" ? "该博主的全部视频" : "这条视频"}中没有找到与这个问题相关的依据，因此我不做推断。你可以换个说法，或者问问他反复讨论过的主题。`;
    } else {
      picks.forEach((c, i) => {});
      const lines = picks.map((c, i) => `${i + 1}. ${c.text.replace(/。$/, "")}。[${i + 1}]`);
      const motif = picks[0].motifName;
      text = `根据${scope.kind === "creator" ? "他在多个视频里" : "这条视频里"}的原话，相关论述主要有：\n\n${lines.join("\n")}\n\n${motif ? `这些说法都落在「${motif}」这个母题下，` : ""}以上仅整理他本人的表述，是否认同请结合引用原文自行判断。`;
      for (let i = 0; i < picks.length; i++) {
        const c = picks[i];
        yield { type: "citation", citation: { n: i + 1, videoId: c.videoId, videoTitle: c.videoTitle, t: c.t, quote: c.text } };
      }
    }
    for (let i = 0; i < text.length; i += 2) {
      if (signal?.aborted) return;
      await wait(22);
      yield { type: "token", text: text.slice(i, i + 2) };
    }
    yield { type: "done", grounded: picks.length > 0 };
  },
};
