/**
 * Every file under src/assets/, keyed by the client's filename without its extension (spec §7.1).
 * Built from disk, so there is no hand-kept list to drift from what was delivered.
 */
const files = import.meta.glob("./assets/**/*.{png,jpg,mp3}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const idOf = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");

export const FILE_COUNT = Object.keys(files).length;
export const MANIFEST: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [idOf(path), url]),
);
export const assetUrl = (id: string): string | undefined => MANIFEST[id];
export const filmId = (slug: string, film: "good" | "under" | "over") =>
  `xray-${slug}-${film}`;
