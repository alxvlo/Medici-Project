export const AWAITING = 'Awaiting client'

/** Client copy: a null sentence is a §12 gap and says so rather than inventing anything. */
export function Copy({ text }: { text: string | null }) {
  return text === null ? <span className="awaiting">{AWAITING}</span> : <>{text}</>
}
