import { useLayoutEffect, useState, type ReactNode } from "react";

export const STAGE_W = 960;
export const STAGE_H = 640;

/** The largest scale at which the whole 960×640 stage fits the viewport. */
export const fitScale = (w: number, h: number) =>
  Math.min(w / STAGE_W, h / STAGE_H);

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(() =>
    fitScale(window.innerWidth, window.innerHeight),
  );
  useLayoutEffect(() => {
    const fit = () => setScale(fitScale(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="viewport">
      <div
        className="stage"
        data-testid="stage"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
      <div className="rotate">Turn your device sideways to play.</div>
    </div>
  );
}
