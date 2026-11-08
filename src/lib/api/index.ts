import { createHttpApi } from "./http";
import { mockApi } from "./mock";
import type { Api } from "./types";

const base = import.meta.env["VITE_API_BASE"] as string | undefined;

/** Views import only this. Set VITE_API_BASE to switch from mock data to the real backend. */
export const api: Api = base ? createHttpApi(base) : mockApi;
export const usingMock = !base;
export * from "./types";
