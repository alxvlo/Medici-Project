import { freshSave, type Save } from "./save";
import type { CaseResult } from "../game/rules";

export const LEVEL_COUNT = 20;
export type Screen =
  | { name: "title" }
  | { name: "levelSelect" }
  | { name: "level"; id: number }
  | { name: "results"; id: number; result: CaseResult };
export type State = { screen: Screen; save: Save; settingsOpen: boolean };
export type Action =
  | { type: "go"; screen: Screen }
  | { type: "finish"; id: number; result: CaseResult; stars: 1 | 2 | 3 }
  | { type: "openSettings" }
  | { type: "closeSettings" }
  | { type: "toggleSound" }
  | { type: "resetProgress" };

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "go":
      return { ...s, screen: a.screen };
    case "finish": {
      const best = Math.max(s.save.stars[a.id] ?? 0, a.stars) as 1 | 2 | 3;
      return {
        ...s,
        screen: { name: "results", id: a.id, result: a.result },
        save: {
          ...s.save,
          unlocked: Math.max(s.save.unlocked, Math.min(a.id + 1, LEVEL_COUNT)),
          stars: { ...s.save.stars, [a.id]: best },
        },
      };
    }
    case "openSettings":
      return { ...s, settingsOpen: true };
    case "closeSettings":
      return { ...s, settingsOpen: false };
    case "toggleSound":
      return {
        ...s,
        save: { ...s.save, settings: { sound: !s.save.settings.sound } },
      };
    case "resetProgress":
      return { ...s, save: { ...freshSave(), settings: s.save.settings } };
  }
}
