import { useRef, useState } from "react";
import type { Level } from "../data/schema";
import { checkTechnique } from "../game/rules";
import { play } from "../audio";
import { Dial } from "../ui/Dial";
import { Img } from "../ui/Img";
import { TimerRing, useCountdown } from "../ui/TimerRing";

const SHAKE_MS = 400;

/**
 * One Confirm for both dials. A wrong value shakes its dial and nothing else: no explanation, no correct
 * value (spec §4.3). The dials start at their minimum so no level's answer is pre-set (spec §5).
 */
export function Technique({
  level,
  onComplete,
}: {
  level: Level;
  onComplete: (v: { kvp: number; mas: number }) => void;
}) {
  const { kvp: k, mas: m } = level.technique;
  const [kvp, setKvp] = useState(k.min);
  const [mas, setMas] = useState(m.min);
  const [wrong, setWrong] = useState({ kvp: false, mas: false });
  const [submitted, setSubmitted] = useState(false);
  const done = useRef(false);

  const submit = () => {
    if (done.current) return;
    done.current = true;
    setSubmitted(true);
    const w = { kvp: !checkTechnique(kvp, k), mas: !checkTechnique(mas, m) };
    if (!w.kvp && !w.mas) return onComplete({ kvp, mas });
    play("sfx-wrong");
    setWrong(w);
    window.setTimeout(() => onComplete({ kvp, mas }), SHAKE_MS);
  };
  // Expiry submits the dials as they stand, judged exactly like Confirm (spec §4.3).
  const left = useCountdown(level.timers.technique, !submitted, submit);

  return (
    <div className="screen technique">
      <Img id="bg-console" className="bg" />
      <h2 className="prompt">Set the exposure factors</h2>
      <TimerRing left={left} total={level.timers.technique} />
      <div className="console">
        <Dial
          art="dial"
          label="kVp"
          value={kvp}
          min={k.min}
          max={k.max}
          step={k.step}
          onChange={setKvp}
          wrong={wrong.kvp}
        />
        <Dial
          art="dial"
          label="mAs"
          value={mas}
          min={m.min}
          max={m.max}
          step={m.step}
          onChange={setMas}
          wrong={wrong.mas}
        />
      </div>
      <button className="btn next" onClick={submit} disabled={submitted}>
        Confirm
      </button>
    </div>
  );
}
