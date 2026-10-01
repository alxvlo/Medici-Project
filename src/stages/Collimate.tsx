import { useState } from "react";
import type { Level } from "../data/schema";
import { checkCollimation } from "../game/rules";
import { correctOption } from "../data/levels";
import { play } from "../audio";
import { Dial } from "../ui/Dial";
import { Img } from "../ui/Img";

const SHAKE_MS = 400;

/**
 * Untimed. Success advances silently; failure shakes and the player adjusts again (spec §4.3).
 * The view is the correct pose image: no separate collimation art was delivered (spec §7.2).
 */
export function Collimate({
  level,
  onComplete,
}: {
  level: Level;
  onComplete: (failures: number) => void;
}) {
  const [w, setW] = useState(100);
  const [h, setH] = useState(100);
  const [failures, setFailures] = useState(0);
  const [shaking, setShaking] = useState(false);
  const { target } = level.collimate;

  const check = () => {
    if (checkCollimation({ w, h }, level.collimate))
      return onComplete(failures);
    play("sfx-wrong");
    setFailures(failures + 1);
    setShaking(true);
    window.setTimeout(() => setShaking(false), SHAKE_MS);
  };

  return (
    <div className="screen collimate">
      <Img id="bg-xray-room" className="bg" />
      <h2 className="prompt">{level.collimate.instruction}</h2>
      <div className={shaking ? "collim-view wrong" : "collim-view"}>
        <Img id={correctOption(level).image} />
        <div
          className="target"
          style={{ width: `${target.w}%`, height: `${target.h}%` }}
        />
        <div className="light" style={{ width: `${w}%`, height: `${h}%` }} />
      </div>
      <div className="knobs">
        <Dial
          art="knob"
          label="Width"
          value={w}
          min={10}
          max={100}
          step={1}
          onChange={setW}
          unit="%"
        />
        <Dial
          art="knob"
          label="Height"
          value={h}
          min={10}
          max={100}
          step={1}
          onChange={setH}
          unit="%"
        />
      </div>
      <button className="btn next" onClick={check}>
        Set collimation
      </button>
    </div>
  );
}
