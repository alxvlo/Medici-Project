import { useEffect, useState } from "react";
import type { Level as LevelData } from "../data/schema";
import type { CaseResult } from "../game/rules";
import { OrderCard } from "../ui/OrderCard";
import { Intake } from "./Intake";
import { Order } from "./Order";
import { Position } from "./Position";
import { Technique } from "./Technique";
import { Collimate } from "./Collimate";
import { Expose } from "./Expose";

const STEPS = [
  "intake",
  "order",
  "position",
  "technique",
  "collimate",
  "expose",
] as const;
const INPUT_GUARD_MS = 300;

/** Runs the six stages in order; each knows nothing of the others and reports one slice of the result. */
export function Level({
  level,
  onFinish,
}: {
  level: LevelData;
  onFinish: (r: CaseResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Partial<CaseResult>>({});
  const advance = (patch: Partial<CaseResult> = {}) => {
    const next = { ...result, ...patch };
    setResult(next);
    if (step === STEPS.length - 1) onFinish(next as CaseResult);
    else setStep(step + 1);
  };
  // Every stage's main button sits in the same spot, so the second click of a double click would land on the
  // next stage's button. Pointer input is ignored for the first INPUT_GUARD_MS of each stage.
  const [armed, setArmed] = useState(-1);
  useEffect(() => {
    const t = window.setTimeout(() => setArmed(step), INPUT_GUARD_MS);
    return () => window.clearTimeout(t);
  }, [step]);
  const name = STEPS[step];
  return (
    <div
      className="level"
      data-stage={name}
      style={armed === step ? undefined : { pointerEvents: "none" }}
    >
      {name === "intake" && (
        <Intake level={level} onComplete={() => advance()} />
      )}
      {name === "order" && <Order level={level} onComplete={() => advance()} />}
      {name === "position" && (
        <Position level={level} onComplete={(pose) => advance({ pose })} />
      )}
      {name === "technique" && (
        <Technique level={level} onComplete={(v) => advance(v)} />
      )}
      {name === "collimate" && (
        <Collimate
          level={level}
          onComplete={(collimationFailures) => advance({ collimationFailures })}
        />
      )}
      {name === "expose" && <Expose onComplete={() => advance()} />}
      {step >= 2 && <OrderCard level={level} docked />}
    </div>
  );
}
