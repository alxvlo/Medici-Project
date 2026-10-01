import { assetUrl } from "./assets";

let enabled = true;
let ambience: HTMLAudioElement | null = null;

export function setSound(on: boolean) {
  enabled = on;
  if (!on) ambience?.pause();
  else if (ambience) void ambience.play().catch(() => {});
}

export function play(id: string) {
  const url = assetUrl(id);
  if (enabled && url) void new Audio(url).play().catch(() => {});
}

/** Browsers allow audio only after a user gesture, so the first click starts the loop. */
export function startAmbience() {
  const url = assetUrl("ambience-clinic");
  if (ambience || !url) return;
  ambience = new Audio(url);
  ambience.loop = true;
  ambience.volume = 0.3;
  if (enabled) void ambience.play().catch(() => {});
}
