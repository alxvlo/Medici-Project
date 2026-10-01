import { useEffect, useRef, useState } from "react";
import { play } from "../audio";
import { Img } from "../ui/Img";

const PREP_MS = 1500;
type Phase = "idle" | "prep" | "fired" | "aborted";
const PROMPT: Record<Phase, string> = {
  idle: "Press and hold to take the exposure",
  prep: "Rotor prep. Keep holding",
  fired: "Exposure taken. Release the button",
  aborted: "Released too early. Press and hold until the exposure fires.",
};

/** Press and hold: rotor prep, the exposure fires, then release. Letting go early aborts; it is never a mistake. */
export function Expose({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<number | undefined>(undefined);
  const done = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const press = () => {
    if (phase === "fired" || phase === "prep") return;
    setPhase("prep");
    timer.current = window.setTimeout(() => {
      play("sfx-xray");
      setPhase("fired");
    }, PREP_MS);
  };
  const release = () => {
    window.clearTimeout(timer.current);
    if (phase === "fired" && !done.current) {
      done.current = true;
      onComplete();
    } else if (phase === "prep") setPhase("aborted");
  };
  const isKey = (k: string) => k === " " || k === "Enter";

  return (
    <div className="screen expose">
      <Img id="bg-console" className="bg" />
      <p className="prompt" role="status">
        {PROMPT[phase]}
      </p>
      <button
        className="expose-button"
        aria-label="Hold to expose"
        onPointerDown={(e) => {
          if (e.button !== 0) return; // a right or middle click is not a press
          // Touch implicitly captures the pointer to the element under the finger (the art inside the button),
          // which would hide a finger sliding off. The capture sits on the target, not on the button.
          const art = e.target as Element;
          art.releasePointerCapture(e.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if (isKey(e.key)) {
            e.preventDefault();
            if (!e.repeat) press();
          }
        }}
        onKeyUp={(e) => {
          if (isKey(e.key)) release();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Img
          id={
            phase === "prep" || phase === "fired"
              ? "radtech-hand-button-pressed"
              : "radtech-hand-button"
          }
        />
      </button>
    </div>
  );
}
