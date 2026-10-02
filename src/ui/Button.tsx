import type { ComponentProps } from "react";
import { Img } from "./Img";

type Props = ComponentProps<"button"> & { small?: boolean };

/** A button drawn on the client's button art: base, hover, and pressed plates stacked, the live one shown by CSS. */
export function Button({ small = false, className, children, ...rest }: Props) {
  const art = small ? "btn-small" : "btn-large";
  return (
    <button
      {...rest}
      className={["btn", small && "small", className].filter(Boolean).join(" ")}
    >
      <Img id={art} className="art" />
      <Img id={`${art}-hover`} className="art hover" />
      <Img id={`${art}-pressed`} className="art pressed" />
      {children}
    </button>
  );
}
