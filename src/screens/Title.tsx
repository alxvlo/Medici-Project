import { Button } from "../ui/Button";
import type { Dispatch } from "react";
import type { Action } from "../app/store";
import type { Save } from "../app/save";
import { Img } from "../ui/Img";

export function Title({
  save,
  dispatch,
}: {
  save: Save;
  dispatch: Dispatch<Action>;
}) {
  return (
    <div className="screen title">
      <Img id="bg-title" className="bg" />
      <Img id="logo" className="logo" alt="Rad Arcade" />
      <nav className="menu">
        <Button
          onClick={() =>
            dispatch({
              type: "go",
              screen: { name: "level", id: save.unlocked },
            })
          }
        >
          Start
        </Button>
        <Button
          onClick={() =>
            dispatch({ type: "go", screen: { name: "levelSelect" } })
          }
        >
          Select Level
        </Button>
        <Button onClick={() => dispatch({ type: "openSettings" })}>
          Settings
        </Button>
      </nav>
    </div>
  );
}
