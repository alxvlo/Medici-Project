import { describe, it, expect } from "vitest";
import { LevelSchema } from "../../src/data/schema";
import l2 from "../../src/data/levels/02-pneumothorax.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- these tests build malformed levels on purpose
type Loose = any;
const accepts = (edit: (l: Loose) => void) => {
  const l: Loose = structuredClone(l2);
  edit(l);
  return LevelSchema.safeParse(l).success;
};

describe("LevelSchema", () => {
  it("accepts a shipped level", () => expect(accepts(() => {})).toBe(true));
  it("rejects two correct positions", () =>
    expect(
      accepts((l) => {
        l.position.options[0].correct = true;
      }),
    ).toBe(false));
  it("rejects no correct position", () =>
    expect(
      accepts((l) => {
        l.position.options[2].correct = false;
      }),
    ).toBe(false));
  it("rejects a position option whose image is not a pose", () =>
    expect(
      accepts((l) => {
        l.position.options[0].image = "xray-ptb-good";
      }),
    ).toBe(false));
  it("rejects a negative tolerance", () =>
    expect(
      accepts((l) => {
        l.technique.kvp.tolerance = -1;
      }),
    ).toBe(false));
  it("rejects a target outside its dial", () =>
    expect(
      accepts((l) => {
        l.technique.mas.target = 60;
      }),
    ).toBe(false));
  it("rejects the removed assess block", () =>
    expect(
      accepts((l) => {
        l.assess = {};
      }),
    ).toBe(false));
  it("rejects the removed position.hint", () =>
    expect(
      accepts((l) => {
        l.position.hint = "x";
      }),
    ).toBe(false));
  it("rejects the removed expose block", () =>
    expect(
      accepts((l) => {
        l.expose = {};
      }),
    ).toBe(false));
});
