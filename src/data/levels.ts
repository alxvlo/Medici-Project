import { LevelSchema, type Level } from "./schema";

const files = import.meta.glob("./levels/*.json", {
  eager: true,
  import: "default",
});

/** Parsed at import: a malformed level stops the game loading, naming the file and the field. */
export const LEVELS: Level[] = Object.entries(files)
  .map(([path, json]) => {
    const r = LevelSchema.safeParse(json);
    if (!r.success)
      throw new Error(
        `${path}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
      );
    return r.data;
  })
  .sort((a, b) => a.id - b.id);

export const levelById = (id: number): Level => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`No level ${id}`);
  return level;
};

export const correctOption = (level: Level) =>
  level.position.options.find((o) => o.correct)!;
