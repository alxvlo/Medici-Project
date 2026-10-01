import { motion, useReducedMotion } from "motion/react";
import { Img } from "./Img";

/** `pop` springs the stars in one by one, timed to land after the results debrief has faded in (see Results). */
export function Stars({ n, pop = false }: { n: number; pop?: boolean }) {
  const reduce = useReducedMotion();
  const still = !pop || reduce;
  return (
    <span className="stars" role="img" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={still ? false : { scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 14,
            delay: 0.8 + i * 0.15,
          }}
        >
          <Img id={i <= n ? "star-full" : "star-empty"} className="star" />
        </motion.span>
      ))}
    </span>
  );
}
