import type { ReactNode } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";

/**
 * Cross-fades a screen or stage under an AnimatePresence. The next one mounts at once (its timers and input guard start
 * then); the exiting one is inert and hidden from assistive tech, so it cannot be clicked, focused, or read twice.
 */
export function Fade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  return (
    <motion.div
      className="fade"
      inert={!present}
      aria-hidden={present ? undefined : true}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  );
}
