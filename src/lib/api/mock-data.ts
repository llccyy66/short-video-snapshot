// Deterministic, realistic-scale mock corpus (PRD §3 sample: 263 videos → 3022 claims → 2056 clusters → 13 motifs).
import type { Claim, Cluster, Creator, Density, Evidence, Motif, Platform, Segment, SummaryBlock, VideoMeta } from "./types";

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

interface MotifSeed {
  name: string;
  thesis: string;
  claims: string[];
  titles: string[];
  source?: string;
}

export const BANK: MotifSeed[] = [
  { name: "现金流优先", thesis: "普通人的财务安全来自稳定现金流，而不是账面资产。", claims: ["现金流比资产重要，账面富贵不等于抗风险", "手里有六个月生活费，才谈得上投资", "没有现金流的资产，本质上是负债", "工资是普通人最被低估的资产"], titles: ["为什么我劝你先攒够六个月生活费", "现金流才是普通人的命根子", "账面富贵的陷阱"] },
  { name: "资产负债表思维", thesis: "用企业的资产负债表视角审视家庭与个人决策。", claims: ["每个家庭都应该画一张自己的资产负债表", "杠杆放大的不是收益，是你的判断失误", "负债端的久期决定了你能扛多久", "先看负债，再看资产"], titles: ["给家庭画一张资产负债表", "杠杆到底放大了什么", "负债久期：被忽视的关键"], source: "辜朝明《大衰退》" },
  { name: "周期不可逆", thesis: "经济周期的方向一旦形成，个人难以对抗，只能顺势调整。", claims: ["周期面前，个人努力的权重被大大压低", "不要在下行周期里做上行周期的决定", "周期的拐点永远比你想的晚", "顺周期的时候人人都是天才"], titles: ["别和周期对着干", "拐点为什么总是来得更晚", "下行周期里的生存法则"], source: "达利欧《债务危机》" },
  { name: "房产去金融化", thesis: "房产正从投资品回归居住品，靠房致富的时代结束。", claims: ["房子正在回归居住属性", "以后买房要按消费品的逻辑算账", "三四线城市的房子流动性会越来越差", "房价不涨就是在跌"], titles: ["房子还能买吗？我的最终答案", "房产回归居住品意味着什么", "三四线城市的房子怎么办"] },
  { name: "普通人的护城河", thesis: "普通人应建立可迁移、难替代的个人能力壁垒。", claims: ["可迁移的能力才是真正的护城河", "别把平台给你的能力当成自己的", "一项技能要能跨三个行业用才算硬", "人脉不是护城河，信用才是"], titles: ["普通人怎么建立护城河", "平台能力 vs 个人能力", "你的技能能跨几个行业"], source: "巴菲特股东信" },
  { name: "利率决定一切", thesis: "利率是资产定价的锚，理解利率就理解了大部分价格变化。", claims: ["利率是所有资产价格的地心引力", "低利率时代，存款的意义在变化", "看懂利率曲线比看懂K线重要", "利率下行周期里，现金类资产收益会持续走低"], titles: ["利率是一切资产的地心引力", "存款利率下行怎么办", "读懂利率曲线"], source: "巴菲特1999年演讲" },
  { name: "消费降级是理性", thesis: "收缩消费不是倒退，而是家庭对不确定性的理性回应。", claims: ["消费降级是对未来的理性定价", "砍掉面子消费，留下体验消费", "买东西先问三年后还用不用", "省下来的钱是你的期权"], titles: ["消费降级不丢人", "哪些钱必须省，哪些不能省", "面子消费清单"] },
  { name: "职业的复利", thesis: "职业积累遵循复利规律，频繁切换赛道会归零。", claims: ["职业的复利需要十年以上的积累", "频繁跳槽会让你的复利归零", "35岁危机本质上是复利断档", "选行业比选公司重要"], titles: ["35岁危机的真相", "跳槽前想清楚这三件事", "职业复利公式"] },
  { name: "警惕叙事泡沫", thesis: "宏大叙事常被用来推高资产价格，需保持怀疑。", claims: ["听到'这次不一样'的时候要格外小心", "叙事越宏大，泡沫越危险", "当出租车司机都在推荐时就该走了", "新概念的估值往往透支了十年"], titles: ["这次真的不一样吗", "拆解一个泡沫叙事", "新概念股的估值游戏"], source: "席勒《非理性繁荣》" },
  { name: "人口结构", thesis: "人口结构变化是未来二十年最确定的长期变量。", claims: ["人口是最慢也最确定的变量", "老龄化会重塑消费结构", "出生率下降影响的是二十年后的需求", "人口流向决定城市的命运"], titles: ["人口拐点之后", "老龄化社会的机会", "城市的命运看人口流向"] },
  { name: "全球化退潮", thesis: "全球化红利减弱，产业链重构带来新的约束与机会。", claims: ["全球化的红利期已经过去了", "产业链正在从效率优先转向安全优先", "出口导向的增长模式面临调整", "区域化会取代全球化"], titles: ["全球化退潮后的世界", "产业链为什么在迁移", "效率让位于安全"] },
  { name: "风险先于收益", thesis: "先考虑能承受多大损失，再考虑能赚多少。", claims: ["先问能亏多少，再问能赚多少", "活下来比赚得多重要", "高收益的产品先查它的风险在哪", "不懂的东西一分钱都别投"], titles: ["先算亏损再算收益", "高收益理财避坑指南", "活下来才有复利"], source: "霍华德·马克斯《投资最重要的事》" },
  { name: "慢就是快", thesis: "长期主义与耐心是普通人在不确定中的最佳策略。", claims: ["慢就是快，少犯错就是赢", "每年进步一点，十年就是质变", "急于求成是普通人最大的敌人", "把时间花在不会过时的东西上"], titles: ["慢就是快", "十年之后你会感谢现在的耐心", "什么东西不会过时"] },
];

const CONTEXTS = ["", "，尤其是对年轻人来说", "，这一点在今年特别明显", "，三四线城市更是如此", "，中产家庭最容易忽视", "，这是我反复验证过的", "，放到十年维度看更清楚", "，很多人到现在还没意识到"];
const PREFIX = ["", "我一直说，", "说白了，", "再强调一遍，", "还是那句话，", "我之前讲过，", "大家记住，"];
const FILLER = ["我们先来看一组数据。", "这里有一个很多人没注意到的细节。", "大家可以在评论区说说自己的情况。", "我举个身边的例子。", "这个问题其实可以拆成两层来看。", "好，我们接着往下说。", "这一段可能有点抽象，我换个说法。", "回到我们今天的主题。"];

interface Profile {
  name: string;
  platform: Platform;
  videos: number;
  claims: number;
  clusters: number;
  motifs: number;
  offset: number;
  startYear: number;
}
export const PROFILES: Record<string, Profile> = {
  "bili-up-1001": { name: "老钱聊经济", platform: "bilibili", videos: 263, claims: 3022, clusters: 2056, motifs: 13, offset: 0, startYear: 2021 },
  "dy-user-yujie": { name: "鱼姐的理财课", platform: "douyin", videos: 42, claims: 418, clusters: 301, motifs: 6, offset: 5, startYear: 2023 },
};

export interface CreatorData {
  creator: Creator;
  videos: VideoMeta[];
  motifs: Motif[];
  claims: Claim[];
  clusters: Cluster[];
  byVideo: Map<string, Claim[]>;
}

const cache = new Map<string, CreatorData>();

export function fakeBvid(r: () => number) {
  const c = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "BV1";
  for (let i = 0; i < 9; i++) s += c[Math.floor(r() * c.length)];
  return s;
}

export function genCreator(id: string): CreatorData | null {
  const p = PROFILES[id];
  if (!p) return null;
  const hit = cache.get(id);
  if (hit) return hit;
  const r = rng(hash(id));
  const seeds = Array.from({ length: p.motifs }, (_, i) => BANK[(i + p.offset) % BANK.length]);
  const weights = seeds.map((_, i) => 1 / Math.pow(i + 1, 0.7));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const pickMotif = () => {
    let x = r() * wsum;
    for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) <= 0) return i;
    return weights.length - 1;
  };
  const start = new Date(`${p.startYear}-01-15`).getTime();
  const end = new Date("2026-10-30").getTime();
  const videos: (VideoMeta & { motif: number })[] = [];
  for (let i = 0; i < p.videos; i++) {
    const m = pickMotif();
    const t = start + ((end - start) * i) / p.videos + r() * 86400000 * 3;
    videos.push({
      id: `${id}-v${i + 1}`,
      platform: p.platform,
      bvid: p.platform === "bilibili" ? fakeBvid(r) : String(7000000000000000000 + Math.floor(r() * 1e15)),
      title: `${pick(r, seeds[m].titles)}${r() < 0.5 ? "" : `（${pick(r, ["上", "下", "完整版", "答粉丝问", "直播回放", "2.0"])}）`}`,
      duration: Math.floor(300 + r() * 2100),
      creatorId: id,
      creatorName: p.name,
      publishedAt: new Date(t).toISOString(),
      motif: m,
    });
  }
  // cluster sizes: a long tail of repeats on top of singletons
  const sizes: number[] = [];
  const top = Math.max(6, Math.round(p.clusters / 100));
  for (let i = 0; i < top; i++) sizes.push(Math.max(8, Math.round(105 * Math.pow(0.86, i) * (p.claims / 3022) ** 0.3)));
  const used = sizes.reduce((a, b) => a + b, 0);
  const remClaims = p.claims - used;
  const remClusters = p.clusters - top;
  const twos = Math.max(0, remClaims - remClusters);
  for (let i = 0; i < remClusters; i++) sizes.push(i < twos ? 2 : 1);

  const years: number[] = [];
  for (let y = p.startYear; y <= 2026; y++) years.push(y);
  const claims: Claim[] = [];
  const clusters: Cluster[] = [];
  const byVideo = new Map<string, Claim[]>();
  const byMotifVideos = seeds.map((_, m) => videos.filter((v) => v.motif === m));
  sizes.forEach((size, k) => {
    const m = k < top ? k % seeds.length : pickMotif();
    const seed = seeds[m];
    const canonical = pick(r, seed.claims) + pick(r, CONTEXTS);
    const cid = `${id}-k${k + 1}`;
    const variants: Claim[] = [];
    for (let j = 0; j < size; j++) {
      const pool = r() < 0.7 && byMotifVideos[m].length ? byMotifVideos[m] : videos;
      const v = pick(r, pool);
      const c: Claim = {
        id: `${cid}-${j}`,
        text: (j === 0 ? "" : pick(r, PREFIX)) + canonical + "。",
        t: Math.floor(r() * v.duration),
        videoId: v.id,
        videoTitle: v.title,
        motifId: `${id}-m${m + 1}`,
        motifName: seed.name,
        paraphrase: !!seed.source && r() < 0.42,
        clusterId: cid,
      };
      variants.push(c);
      claims.push(c);
      const list = byVideo.get(v.id) ?? [];
      list.push(c);
      byVideo.set(v.id, list);
    }
    clusters.push({ id: cid, canonical, motifName: seed.name, count: size, videoCount: new Set(variants.map((x) => x.videoId)).size, variants });
  });
  byVideo.forEach((l) => l.sort((a, b) => a.t - b.t));
  const vmap = new Map(videos.map((v) => [v.id, v]));

  const motifs: Motif[] = seeds.map((s, m) => {
    const mid = `${id}-m${m + 1}`;
    const mc = claims.filter((c) => c.motifId === mid);
    const vids = new Set(mc.map((c) => c.videoId));
    const dates = [...vids].map((v) => vmap.get(v)!.publishedAt).sort();
    const para = mc.filter((c) => c.paraphrase).length / Math.max(1, mc.length);
    const timeline = years.map((y) => mc.filter((c) => vmap.get(c.videoId)!.publishedAt.startsWith(String(y))).length);
    const ev: Evidence[] = mc.slice(0, 3).map((c, i) => ({
      quote: c.text,
      videoId: c.videoId,
      videoTitle: c.videoTitle,
      t: c.t,
      basis: s.source
        ? i === 0
          ? `核心表述与${s.source}中的论述高度相近，未标注出处`
          : `论证结构沿用${s.source}的框架，举例为本土化改写`
        : i === 0
          ? "未检索到明显的外部同源表述，最早出现于本人早期视频"
          : "表述随时间迭代，有个人经验与案例支撑",
    }));
    return {
      id: mid,
      name: s.name,
      thesis: s.thesis,
      claimCount: mc.length,
      videoCount: vids.size,
      span: [dates[0] ?? "", dates[dates.length - 1] ?? ""],
      provenance: para > 0.3 ? "paraphrase" : para < 0.1 ? "original" : "mixed",
      confidence: mc.length > 250 ? "high" : mc.length > 90 ? "mid" : "low",
      timeline,
      evidence: ev,
    };
  });
  motifs.sort((a, b) => b.claimCount - a.claimCount);
  const paraphraseRate = claims.filter((c) => c.paraphrase).length / claims.length;
  const top3 = motifs.slice(0, 3).reduce((a, b) => a + b.claimCount, 0) / claims.length;
  const creator: Creator = {
    id,
    platform: p.platform,
    name: p.name,
    status: "ready",
    portrait: `一位以"${motifs[0].name}"为第一原理的${p.platform === "bilibili" ? "宏观经济" : "家庭理财"}解说者，擅长把宏观叙事翻译成普通人的家庭决策，输出偏防守型、反复强调风险的观点。`,
    stats: { videos: p.videos, claims: p.claims, deduped: p.clusters, motifs: p.motifs },
    repeatRate: 1 - p.clusters / p.claims,
    originalRate: 1 - paraphraseRate,
    paraphraseRate,
    concentration: top3,
    years,
    fitFor: ["刚开始工作、想建立基础财务观的年轻人", "需要一套保守决策框架的家庭", "想快速了解宏观经济常识的非专业人士"],
    cautions: ["观点整体偏悲观防守，进攻型投资者需交叉参考", `约 ${Math.round(paraphraseRate * 100)}% 的观点转述自经典著作且多未标注出处`, "部分预测性判断缺少可回溯的验证"],
  };
  const data: CreatorData = { creator, videos, motifs, claims, clusters, byVideo };
  cache.set(id, data);
  return data;
}

/** Build a summary + transcript for any video, grounded on its claims when known. */
export function genVideoContent(meta: VideoMeta, sentences: { text: string; t: number }[], density: Density, frameShots: boolean) {
  const r = rng(hash(meta.id + "content"));
  const sents = sentences.length >= 6 ? sentences : fillSentences(meta, r);
  const step = Math.max(1, Math.floor(sents.length / 6));
  const key = sents.filter((_, i) => i % step === 0).slice(0, 6);
  const sectionTitles = ["问题从哪来", "核心判断", "论据与案例", "反方观点", "对普通人的建议", "结语"];
  const brief: SummaryBlock[] = [
    { kind: "p", text: `本期核心：${key[0].text.replace(/。$/, "")}。` },
    ...key.slice(1, 4).map((s) => ({ kind: "li" as const, text: s.text, t: s.t })),
  ];
  const standard: SummaryBlock[] = [];
  const detailed: SummaryBlock[] = [];
  key.forEach((s, i) => {
    if (i < 4) {
      standard.push({ kind: "h", text: sectionTitles[i] });
      standard.push({ kind: "p", text: `${s.text}${pick(r, FILLER)}`, t: s.t });
    }
    detailed.push({ kind: "h", text: sectionTitles[i] });
    detailed.push({ kind: "p", text: `${s.text}作者在这一段展开了具体推理：${pick(r, FILLER)}`, t: s.t });
    const extra = sents[Math.min(sents.length - 1, sents.indexOf(s) + 1)];
    detailed.push({ kind: "li", text: extra.text, t: extra.t });
    detailed.push({ kind: "li", text: `${pick(r, FILLER)}${pick(r, sents).text}`, t: Math.min(meta.duration - 1, s.t + 40) });
  });
  const shotsN = { off: 0, low: 2, medium: 4, high: 8 }[density];
  const n = frameShots ? shotsN : Math.min(shotsN, 1);
  const insertShots = (blocks: SummaryBlock[]) => {
    if (!n) return blocks;
    const out: SummaryBlock[] = [];
    const every = Math.max(2, Math.floor(blocks.length / n));
    let made = 0;
    blocks.forEach((b, i) => {
      out.push(b);
      if (made < n && i > 0 && i % every === 0) {
        const t = "t" in b && b.t != null ? b.t : Math.floor((meta.duration * (made + 1)) / (n + 1));
        out.push({ kind: "shot", t, caption: frameShots ? `关键帧 · ${sectionTitleAt(blocks, i)}` : "图文配图" });
        made++;
      }
    });
    return out;
  };
  const transcript: Segment[] = [];
  let t = 0;
  const sorted = [...sents].sort((a, b) => a.t - b.t);
  let si = 0;
  while (t < meta.duration) {
    while (si < sorted.length && sorted[si].t <= t + 15) {
      transcript.push({ t: sorted[si].t, text: sorted[si].text });
      si++;
    }
    transcript.push({ t, text: pick(r, FILLER) });
    t += 12 + Math.floor(r() * 10);
  }
  transcript.sort((a, b) => a.t - b.t);
  return { summaries: { brief, standard: insertShots(standard), detailed: insertShots(detailed) }, transcript };
}

function sectionTitleAt(blocks: SummaryBlock[], i: number) {
  for (let j = i; j >= 0; j--) if (blocks[j].kind === "h") return (blocks[j] as { text: string }).text;
  return "开场";
}

function fillSentences(meta: VideoMeta, r: () => number) {
  const seed = BANK[hash(meta.id) % BANK.length];
  const out: { text: string; t: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const s = seed.claims[i % seed.claims.length];
    out.push({ text: pick(r, PREFIX) + s + pick(r, CONTEXTS) + "。", t: Math.floor((meta.duration * (i + 0.5)) / 10) });
  }
  return out;
}

export function standaloneMeta(id: string, platform: Platform): VideoMeta {
  const r = rng(hash(id));
  const seed = BANK[hash(id) % BANK.length];
  const code = id.replace(/^(bili-|dy-)/, "");
  return {
    id,
    platform,
    bvid: code,
    title: pick(r, seed.titles),
    duration: Math.floor(420 + r() * 1800),
    publishedAt: new Date(Date.now() - r() * 1e10).toISOString(),
  };
}
