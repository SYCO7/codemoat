"use client";

import { motion, useReducedMotion } from "motion/react";

export function ScanGraphic() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 340 340" className="w-full max-w-[340px] drop-shadow-[0_20px_60px_rgba(124,95,208,0.25)]">
        <defs>
          <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4b0ff" />
            <stop offset="100%" stopColor="#7c5fd0" />
          </linearGradient>
          <clipPath id="shieldClip">
            <path d="M170 20 L290 62 V158 C290 232 238 288 170 320 C102 288 50 232 50 158 V62 Z" />
          </clipPath>
          <linearGradient id="scanBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
            <stop offset="50%" stopColor="#c9b8ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d="M170 20 L290 62 V158 C290 232 238 288 170 320 C102 288 50 232 50 158 V62 Z"
          fill="rgba(167,139,250,0.05)"
          stroke="url(#shieldStroke)"
          strokeWidth="2.5"
          animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <g clipPath="url(#shieldClip)">
          {[
            { y: 96, w: 120, o: 0.28 },
            { y: 114, w: 150, o: 0.18 },
            { y: 132, w: 90, o: 0.18 },
            { y: 150, w: 168, o: 0.55, c: "#ef4444" },
            { y: 168, w: 110, o: 0.18 },
            { y: 186, w: 140, o: 0.28 },
            { y: 204, w: 95, o: 0.5, c: "#22c55e" },
            { y: 222, w: 130, o: 0.18 },
          ].map((line, i) => (
            <motion.rect
              key={i}
              x={86}
              y={line.y}
              width={line.w}
              height={6}
              rx={3}
              fill={line.c ? `${line.c}` : "rgba(233,233,240,0.6)"}
              opacity={line.o}
              animate={reduceMotion ? undefined : { opacity: [line.o, line.o + 0.3, line.o] }}
              transition={{ duration: 5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          ))}
          {!reduceMotion && (
            <motion.rect
              x={50}
              width={240}
              height={46}
              fill="url(#scanBeam)"
              animate={{ y: [30, 290], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </g>
      </svg>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -8, 0] }}
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : { opacity: { duration: 0.4, delay: 0.3 }, y: { duration: 5, repeat: Infinity, delay: 0.3, ease: "easeInOut" } }
        }
        className="absolute right-[-4%] top-[12%] flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-2 text-xs font-medium shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] backdrop-blur"
      >
        <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
        CWE-798 found
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -8, 0] }}
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : { opacity: { duration: 0.4, delay: 1.1 }, y: { duration: 5, repeat: Infinity, delay: 1.1, ease: "easeInOut" } }
        }
        className="absolute bottom-[14%] left-[-6%] flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-2 text-xs font-medium shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] backdrop-blur"
      >
        <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        0 secrets leaked
      </motion.div>
    </div>
  );
}
