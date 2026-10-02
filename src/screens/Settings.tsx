import { Button } from "../ui/Button";
import { Img } from "../ui/Img";
import { Panel } from "../ui/Panel";
import { useState, type Dispatch } from "react";
import type { Action } from "../app/store";
import type { Save } from "../app/save";

/** Sound and reset progress only: timers are mandatory and there are no hints (spec §4.2). */
export function Settings({
  save,
  dispatch,
}: {
  save: Save;
  dispatch: Dispatch<Action>;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="overlay" role="dialog" aria-label="Settings">
      <Panel title="Settings">
        <label className="row">
          <input
            type="checkbox"
            checked={save.settings.sound}
            onChange={() => dispatch({ type: "toggleSound" })}
          />
          <Img
            id={save.settings.sound ? "icon-sound-on" : "icon-sound-off"}
            className="sound-icon"
          />
          Sound
        </label>
        {confirming ? (
          <div className="row">
            Erase all progress?
            <Button
              small

              onClick={() => {
                dispatch({ type: "resetProgress" });
                setConfirming(false);
              }}
            >
              Yes, reset
            </Button>
            <Button small onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button small onClick={() => setConfirming(true)}>
            Reset progress
          </Button>
        )}
        <Button
          small

          onClick={() => dispatch({ type: "closeSettings" })}
        >
          Close
        </Button>
      </Panel>
    </div>
  );
}
