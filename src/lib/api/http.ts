// Real backend adapter (FastAPI REST + SSE). Enabled when VITE_API_BASE is set.
import type { Api, AskEvent } from "./types";

export function createHttpApi(base: string): Api {
  const url = (p: string) => `${base.replace(/\/$/, "")}${p}`;
  async function req<T>(p: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url(p), { headers: { "Content-Type": "application/json" }, ...init });
    if (!res.ok) throw new Error(`请求失败（${res.status}）`);
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }
  const enc = encodeURIComponent;
  return {
    listCreators: () => req("/api/creators"),
    getCreator: (id) => req(`/api/creators/${enc(id)}`),
    listMotifs: (id) => req(`/api/creators/${enc(id)}/motifs`),
    listVideos: (id, c) => req(`/api/creators/${enc(id)}/videos?cursor=${c}`),
    listClaimsByVideo: (id, c) => req(`/api/creators/${enc(id)}/claims?group=video&cursor=${c}`),
    listClusters: (id, c, mode) => req(`/api/creators/${enc(id)}/clusters?mode=${mode}&cursor=${c}`),
    listVideoClaims: (id) => req(`/api/videos/${enc(id)}/claims`),
    getVideo: (id) => req(`/api/videos/${enc(id)}`),
    getJob: (id) => req(`/api/jobs/${enc(id)}`),
    retryJob: (id) => req(`/api/jobs/${enc(id)}/retry`, { method: "POST" }),
    startVideo: (o) => req("/api/videos", { method: "POST", body: JSON.stringify(o) }),
    startCreator: (o) => req("/api/creators", { method: "POST", body: JSON.stringify(o) }),
    listHistory: (c) => req(`/api/history?cursor=${c}`),
    deleteHistory: (id) => req(`/api/history/${enc(id)}`, { method: "DELETE" }),
    async *ask(scope, question, signal): AsyncGenerator<AskEvent> {
      const res = await fetch(url("/api/ask"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ scope: { kind: scope.kind, id: scope.id }, question }),
        signal: signal ?? null,
      });
      if (!res.ok || !res.body) throw new Error(`提问失败（${res.status}）`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const data = chunk.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
          if (data) yield JSON.parse(data) as AskEvent;
        }
      }
    },
  };
}
