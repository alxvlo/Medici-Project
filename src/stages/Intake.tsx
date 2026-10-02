import { Button } from "../ui/Button";
import type { Level } from "../data/schema";
import { Copy } from "../ui/Copy";
import { Img } from "../ui/Img";

export function Intake({
  level,
  onComplete,
}: {
  level: Level;
  onComplete: () => void;
}) {
  return (
    <div className="screen intake">
      <Img id="bg-reception" className="bg" />
      <Img
        id={level.patient.sprite}
        className="patient"
        alt={level.patient.name}
      />
      <div className="bubble">
        <Img id="chat-bubble" className="art" />
        <p>
          <Copy text={level.patient.line} />
        </p>
      </div>
      <Button className="next" onClick={onComplete}>
        Continue
      </Button>
    </div>
  );
}
