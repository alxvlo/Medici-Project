import { z } from "zod";

export const SAVE_KEY = "medici.save.v1";
export type Save = {
  version: 1;
  unlocked: number;
  stars: Record<number, 0 | 1 | 2 | 3>;
  settings: { sound: boolean };
};
type Store = Pick<Storage, "getItem" | "setItem">;

// z.object strips unknown keys, which is how the retired timers/hints settings are dropped.
const SaveSchema = z.object({
  version: z.literal(1),
  unlocked: z.number().int().min(1).max(20),
  stars: z.record(
    z.string(),
    z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  ),
  settings: z.object({ sound: z.boolean() }),
});

export const freshSave = (): Save => ({
  version: 1,
  unlocked: 1,
  stars: {},
  settings: { sound: true },
});

/** Private browsing can make even reading window.localStorage throw. */
function browserStorage(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Anything missing, unreadable, or out of range gives a fresh save, never a crash (spec §6). */
export function loadSave(storage: Store | null = browserStorage()): Save {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    const parsed = SaveSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Save) : freshSave();
  } catch {
    return freshSave();
  }
}

export function writeSave(
  save: Save,
  storage: Store | null = browserStorage(),
) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Storage full or blocked: progress lives in memory for this session only.
  }
}
