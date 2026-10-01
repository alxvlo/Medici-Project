import { describe, it, expect } from "vitest";
import {
  loadSave,
  writeSave,
  freshSave,
  SAVE_KEY,
  type Save,
} from "../../src/app/save";

function memory(raw?: string) {
  const m = new Map<string, string>();
  if (raw !== undefined) m.set(SAVE_KEY, raw);
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}
const valid: Save = {
  version: 1,
  unlocked: 4,
  stars: { 1: 3, 2: 2, 3: 1 },
  settings: { sound: false },
};
const raw = (x: unknown) => memory(JSON.stringify(x));

describe("loadSave", () => {
  it("starts fresh with no save", () =>
    expect(loadSave(memory())).toEqual(freshSave()));
  it("loads a valid save", () => expect(loadSave(raw(valid))).toEqual(valid));
  it("starts fresh on invalid JSON, without throwing", () =>
    expect(loadSave(memory("{nope"))).toEqual(freshSave()));
  it("starts fresh on another version", () =>
    expect(loadSave(raw({ ...valid, version: 2 }))).toEqual(freshSave()));
  it("drops the retired timers and hints settings", () =>
    expect(
      loadSave(
        raw({
          ...valid,
          settings: { sound: false, timers: true, hints: false },
        }),
      ),
    ).toEqual(valid));
  it("starts fresh when storage itself throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
    };
    expect(loadSave(blocked)).toEqual(freshSave());
  });
  it("starts fresh on an unlock past level 20", () =>
    expect(loadSave(raw({ ...valid, unlocked: 25 }))).toEqual(freshSave()));
  it("starts fresh on an impossible star count", () =>
    expect(loadSave(raw({ ...valid, stars: { 1: 7 } }))).toEqual(freshSave()));
});

describe("writeSave", () => {
  it("round-trips through loadSave", () => {
    const s = memory();
    writeSave(valid, s);
    expect(loadSave(s)).toEqual(valid);
  });
  it("does not throw when storage refuses the write", () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => writeSave(valid, full)).not.toThrow();
  });
});
