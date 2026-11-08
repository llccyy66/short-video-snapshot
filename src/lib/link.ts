import type { Platform } from "./api/types";

export type LinkKind = "video" | "creator";
export interface ParsedLink {
  platform: Platform;
  kind: LinkKind;
  id: string; // stable id used by the app
  url: string;
  label: string;
}

const URL_RE = /https?:\/\/[^\s，。]+/i;

/** Recognize any B站/抖音 link the user pastes, including share text wrapping the link. */
export function parseLink(input: string): ParsedLink | null {
  const raw = input.trim();
  if (!raw) return null;
  const bvOnly = raw.match(/^(BV[0-9A-Za-z]{10})$/);
  if (bvOnly) return mk("bilibili", "video", `bili-${bvOnly[1]}`, `https://www.bilibili.com/video/${bvOnly[1]}`);

  const m = raw.match(URL_RE);
  const url = m ? m[0] : /^[\w.-]+\.[a-z]{2,}\//i.test(raw) ? `https://${raw}` : null;
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const path = u.pathname;

  if (host === "space.bilibili.com") {
    const mid = path.match(/^\/(\d+)/);
    if (mid) return mk("bilibili", "creator", `bili-up-${mid[1]}`, url);
    return null;
  }
  if (host.endsWith("bilibili.com")) {
    const bv = path.match(/\/video\/(BV[0-9A-Za-z]{10})/);
    if (bv) return mk("bilibili", "video", `bili-${bv[1]}`, url);
    return null;
  }
  if (host === "b23.tv" || host === "bili2233.cn") {
    const code = path.replace(/\//g, "");
    if (/^BV[0-9A-Za-z]{10}$/.test(code)) return mk("bilibili", "video", `bili-${code}`, url);
    if (code) return mk("bilibili", "video", `bili-b23-${code}`, url);
    return null;
  }
  if (host.endsWith("douyin.com") || host.endsWith("iesdouyin.com")) {
    if (host === "v.douyin.com") {
      const code = path.replace(/\//g, "");
      return code ? mk("douyin", "video", `dy-s-${code}`, url) : null;
    }
    const vid = path.match(/\/(?:video|note)\/(\d+)/) ?? path.match(/\/share\/video\/(\d+)/);
    if (vid) return mk("douyin", "video", `dy-${vid[1]}`, url);
    const modal = u.searchParams.get("modal_id");
    if (modal && /^\d+$/.test(modal)) return mk("douyin", "video", `dy-${modal}`, url);
    const user = path.match(/\/user\/([\w-]+)/);
    if (user) return mk("douyin", "creator", `dy-user-${user[1]}`, url);
    return null;
  }
  return null;
}

function mk(platform: Platform, kind: LinkKind, id: string, url: string): ParsedLink {
  const p = platform === "bilibili" ? "B站" : "抖音";
  return { platform, kind, id, url, label: `${p} · ${kind === "video" ? "单个视频" : "博主主页"}` };
}
