import { createContext, useContext, type ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';

export const TimeContext = createContext<MotionValue<number>>(null as unknown as MotionValue<number>);
export const useTime = () => useContext(TimeContext);

/** Linear ramp of the film clock between two film times. */
export function useRamp(a: number, b: number, from: number, to: number): MotionValue<number> {
  return useTransform(useTime(), [a, b], [from, to]);
}

export const useProgress = (a: number, b: number) => useRamp(a, b, 0, 1);

/** Opacity 0 to 1 starting at `a`. */
export function useFadeIn(a: number, dur = 0.9) {
  return useRamp(a, a + dur, 0, 1);
}

/** Pseudo random in [0,1), deterministic per seed so layouts are stable. */
export function rnd(i: number, k = 1): number {
  const x = Math.sin(i * 12.9898 * k + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A scene layer that dissolves in and out around its film window. */
export function Layer({ start, end, children }: { start: number; end: number; children: ReactNode }) {
  const t = useTime();
  const opacity = useTransform(t, [start - 0.6, start + 0.6, end - 0.6, end + 0.6], [0, 1, 1, 0]);
  return (
    <motion.div className="layer" style={{ opacity }} aria-hidden={false}>
      {children}
    </motion.div>
  );
}
