import type { CSSProperties } from "react";
import { assetUrl } from "../assets";

type Props = {
  id: string;
  className?: string;
  alt?: string;
  style?: CSSProperties;
};

/** An asset by id. A file nobody has delivered renders as a grey box labelled with its id (spec §7.4). */
export function Img({ id, className, alt = "", style }: Props) {
  const url = assetUrl(id);
  if (!url) {
    return (
      <div
        className={className ? `${className} placeholder` : "placeholder"}
        style={style}
        data-asset={id}
        role="img"
        aria-label={`Missing art: ${id}`}
      >
        {id}
      </div>
    );
  }
  return (
    <img
      src={url}
      className={className}
      style={style}
      alt={alt}
      data-asset={id}
      draggable={false}
    />
  );
}
