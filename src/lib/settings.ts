import { useSyncExternalStore } from "react";
import type { Density, Level } from "./api/types";

export interface Settings { level: Level; density: Density }
const KEY = "zbili.settings";
const DEFAULT: Settings = { level: "standard", density: "medium" };
let cache: Settings | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  if (cache) return cache;
  try {
    cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}
export function setSettings(patch: Partial<Settings>) {
  cache = { ...read(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}
export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => DEFAULT,
  );
}
