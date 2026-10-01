import type { Level } from "../data/schema";
import { Copy } from "./Copy";
import { Img } from "./Img";

/** The complete patient information from the case database (spec §4.3). Findings never appear here. */
export function OrderCard({
  level,
  docked = false,
}: {
  level: Level;
  docked?: boolean;
}) {
  const { patient: p, order: o } = level;
  const rows: [string, string | null][] = [
    ["Name", p.name],
    ["Age/Sex", `${p.age}/${p.sex}`],
    ["Body habitus", p.habitus],
    ["Date of birth", p.dob],
    ["Patient ID", p.patientId],
    ["Admitted", p.admitted],
    ["Chief complaint", o.complaint],
    // A null history is a faithful transcription, not a gap (spec §12), so the row is omitted.
    ...(o.history === null
      ? []
      : [["Relevant history", o.history] as [string, string]]),
    ["Provisional diagnosis", o.diagnosis],
    ["Examination requested", o.exam],
    ["Requested projection", o.requested],
    ["Mission", o.mission],
    ["Structures to show", o.structures],
  ];
  return (
    <aside
      className={docked ? "order-card docked" : "order-card"}
      aria-label="Doctor's order"
    >
      <Img id="order-card" className="art" />
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>
              <Copy text={v} />
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
