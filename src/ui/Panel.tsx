import type { ReactNode } from "react";
import { Img } from "./Img";

/** The client's popup panel: the title sits in its header band, and a long body scrolls inside it. */
export function Panel({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <Img id="popup-panel" className="art" />
      <h2>{title}</h2>
      <div className="panel-body">{children}</div>
    </div>
  );
}
