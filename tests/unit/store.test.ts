import { describe, it, expect } from "vitest";
import { reducer, type State } from "../../src/app/store";
import { freshSave } from "../../src/app/save";
import type { CaseResult } from "../../src/game/rules";

const result: CaseResult = {
  pose: "pose-chest-pa",
  kvp: 125,
  mas: 4,
  collimationFailures: 0,
};
const at = (
  unlocked: number,
  stars: State["save"]["stars"] = {},
  sound = true,
): State => ({
  screen: { name: "level", id: 1 },
  settingsOpen: false,
  save: { ...freshSave(), unlocked, stars, settings: { sound } },
});

describe("reducer", () => {
  it("finishing a level unlocks the next and shows results", () => {
    const s = reducer(at(1), { type: "finish", id: 1, result, stars: 2 });
    expect(s.save.unlocked).toBe(2);
    expect(s.save.stars[1]).toBe(2);
    expect(s.screen).toEqual({ name: "results", id: 1, result });
  });
  it("never unlocks past level 20", () =>
    expect(
      reducer(at(20), { type: "finish", id: 20, result, stars: 3 }).save
        .unlocked,
    ).toBe(20));
  it("keeps the best stars on a worse replay", () =>
    expect(
      reducer(at(5, { 1: 3 }), { type: "finish", id: 1, result, stars: 1 }).save
        .stars[1],
    ).toBe(3));
  it("replaying an early level does not lower the unlock", () =>
    expect(
      reducer(at(5), { type: "finish", id: 2, result, stars: 3 }).save.unlocked,
    ).toBe(5));
  it("reset progress keeps the sound setting", () => {
    const s = reducer(at(9, { 1: 3 }, false), { type: "resetProgress" });
    expect(s.save).toEqual({ ...freshSave(), settings: { sound: false } });
  });
  it("toggles sound", () =>
    expect(reducer(at(1), { type: "toggleSound" }).save.settings.sound).toBe(
      false,
    ));
});
