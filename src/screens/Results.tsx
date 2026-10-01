import type { Dispatch } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Action } from "../app/store";
import type { Level } from "../data/schema";
import {
  checkPosition,
  checkTechnique,
  collimatedFirstTry,
  filmFor,
  mistakes,
  stars,
  type CaseResult,
  type Film,
} from "../game/rules";
import { filmId } from "../assets";
import { correctOption } from "../data/levels";
import { Copy } from "../ui/Copy";
import { Img } from "../ui/Img";
import { Stars } from "../ui/Stars";

const FILM_LABEL: Record<Film, string> = {
  good: "DIAGNOSTIC",
  under: "UNDEREXPOSED",
  over: "OVEREXPOSED",
};

function Row({
  name,
  ok,
  value,
  note,
}: {
  name: string;
  ok: boolean;
  value: string;
  note?: string | null;
}) {
  return (
    <tr className={ok ? "ok" : "bad"}>
      <th>{name}</th>
      <td aria-label={ok ? "correct" : "wrong"}>{ok ? "✓" : "✗"}</td>
      <td>
        {value}
        {note !== undefined && (
          <p className="note">
            <Copy text={note} />
          </p>
        )}
      </td>
    </tr>
  );
}

/** The film, the stars, then the debrief: everything the stages withheld (spec §4.5). */
export function Results({
  level,
  result,
  dispatch,
}: {
  level: Level;
  result: CaseResult;
  dispatch: Dispatch<Action>;
}) {
  const reduce = useReducedMotion();
  const secs = (s: number) => (reduce ? 0 : s);
  const t = level.technique;
  const film = filmFor(result.kvp, result.mas, t);
  const correct = correctOption(level);
  const chosen = level.position.options.find((o) => o.image === result.pose);
  const poseOk = checkPosition(result.pose, level);
  const kvpOk = checkTechnique(result.kvp, t.kvp);
  const masOk = checkTechnique(result.mas, t.mas);
  const collimOk = collimatedFirstTry(result.collimationFailures);
  const go = (id: number) =>
    dispatch({ type: "go", screen: { name: "level", id } });

  return (
    <div className="screen results">
      <Img id="bg-viewer" className="bg" />
      <motion.div
        className="lightbox"
        initial={{ opacity: 0, filter: "brightness(3)" }}
        animate={{ opacity: 1, filter: "brightness(1)" }}
        transition={{ duration: secs(1.2), ease: "easeOut" }}
      >
        <Img
          id={filmId(level.films.slug, film)}
          className="film"
          alt={`${FILM_LABEL[film]} radiograph`}
        />
      </motion.div>
      <motion.div
        className="debrief"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: secs(0.5), duration: secs(0.3) }}
      >
        <h2>
          Level {level.id}: {level.title}
        </h2>
        <Stars n={stars(mistakes(result, level))} pop />
        <table>
          <tbody>
            <Row
              name="Position"
              ok={poseOk}
              value={
                poseOk
                  ? correct.label
                  : `${chosen ? chosen.label : "No position chosen"} · correct ${correct.label}`
              }
              note={poseOk || !chosen ? undefined : chosen.why}
            />
            <Row
              name="kVp"
              ok={kvpOk}
              value={
                kvpOk
                  ? `${result.kvp}`
                  : `set ${result.kvp} · correct ${t.kvp.target}`
              }
              note={kvpOk ? undefined : t.wrongKvp}
            />
            <Row
              name="mAs"
              ok={masOk}
              value={
                masOk
                  ? `${result.mas}`
                  : `set ${result.mas} · correct ${t.mas.target}`
              }
              note={masOk ? undefined : t.wrongMas}
            />
            <Row
              name="Collimation"
              ok={collimOk}
              value={
                collimOk
                  ? "First attempt"
                  : `${result.collimationFailures + 1} attempts`
              }
            />
            {/* The film follows from kVp and mAs, already marked above: reported, never marked or counted (spec §4.5). */}
            <tr className="film-row">
              <th>Film</th>
              <td />
              <td>
                {FILM_LABEL[film]}
                {film !== "good" && (
                  <p className="note">
                    <Copy
                      text={
                        film === "under"
                          ? level.films.underNote
                          : level.films.overNote
                      }
                    />
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="note">
          <Copy text={t.note} />
        </p>
        {level.findings && (
          <section className="findings">
            <h3>Radiologist's findings</h3>
            <p>{level.findings}</p>
          </section>
        )}
      </motion.div>
      <div className="actions">
        {level.id < 20 && (
          <button className="btn" onClick={() => go(level.id + 1)}>
            Next case
          </button>
        )}
        <button className="btn" onClick={() => go(level.id)}>
          Repeat case
        </button>
        <button
          className="btn"
          onClick={() =>
            dispatch({ type: "go", screen: { name: "levelSelect" } })
          }
        >
          Level select
        </button>
      </div>
    </div>
  );
}
