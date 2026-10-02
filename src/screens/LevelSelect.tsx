import type { Dispatch } from "react";
import type { Action } from "../app/store";
import type { Save } from "../app/save";
import type { Level } from "../data/schema";
import { LEVELS } from "../data/levels";
import { Img } from "../ui/Img";
import { Stars } from "../ui/Stars";

const SECTIONS: { id: Level["section"]; title: string }[] = [
  { id: "chest", title: "Chest" },
  { id: "upper-ext", title: "Upper extremity" },
  { id: "lower-ext", title: "Lower extremity" },
  { id: "abdomen", title: "Abdomen" },
  { id: "skull", title: "Skull" },
  { id: "refresher", title: "Refresher" },
];

export function LevelSelect({
  save,
  dispatch,
}: {
  save: Save;
  dispatch: Dispatch<Action>;
}) {
  return (
    <div className="screen level-select">
      <Img id="bg-title" className="bg" />
      <header>
        <button
          className="icon-btn"
          aria-label="Back"
          onClick={() => dispatch({ type: "go", screen: { name: "title" } })}
        >
          <Img id="icon-back" />
        </button>
        <h1>Select a case</h1>
        <button
          className="icon-btn"
          aria-label="Settings"
          onClick={() => dispatch({ type: "openSettings" })}
        >
          <Img id="icon-settings" />
        </button>
      </header>
      <div className="card-list" data-testid="card-list">
        {SECTIONS.map((sec) => {
          const levels = LEVELS.filter((l) => l.section === sec.id);
          const done = levels.filter((l) => (save.stars[l.id] ?? 0) > 0).length;
          // A section stays collapsed to its heading until its first level is unlocked (spec §4.2).
          const open = levels[0].id <= save.unlocked;
          return (
            <section key={sec.id}>
              <h2>
                {sec.title}{" "}
                <span className="progress">
                  {done}/{levels.length}
                </span>
              </h2>
              {open && (
                <div className="cards">
                  {levels.map((l) => {
                    const locked = l.id > save.unlocked;
                    return (
                      <button
                        key={l.id}
                        className="card"
                        disabled={locked}
                        aria-label={`Level ${l.id}: ${l.title}${locked ? " (locked)" : ""}`}
                        onClick={() =>
                          dispatch({
                            type: "go",
                            screen: { name: "level", id: l.id },
                          })
                        }
                      >
                        <Img id="level-card" className="art" />
                        <span className="num">{l.id}</span>
                        <span className="body">
                          <span className="name">{l.title}</span>
                          <span className="exam">{l.order.exam}</span>
                        </span>
                        <span className="foot">
                          {locked ? (
                            <Img id="icon-lock" className="lock" />
                          ) : (
                            <Stars n={save.stars[l.id] ?? 0} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
