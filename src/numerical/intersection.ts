import { MathPoint, LabFunction } from '../core/types.js';

/**
 * Finds intersections between two Cartesian functions.
 * Use this for high-precision field data verification.
 */
export function findIntersections(
  labA: LabFunction,
  labB: LabFunction,
  minX: number,
  maxX: number
): MathPoint[] {
  // 1. Scanning Phase: Find approximate locations where functions might cross.
  const initialGuesses: number[] = [];
  const step = (maxX - minX) / 5000; // Increased scan resolution
  let lastDiff: number | null = null;

  for (let x = minX; x <= maxX; x += step) {
    const yA = labA.getY(x);
    const yB = labB.getY(x);

    if (yA === null || yB === null) {
      lastDiff = null; // Reset if we are outside the domain of either function
      continue;
    }

    const currentDiff = yA - yB;
    if (lastDiff !== null && lastDiff * currentDiff < 0) {
      initialGuesses.push(x - step / 2); // Found a zero-crossing
    }
    lastDiff = currentDiff;
  }

  // 2. Newton's Method Phase: Refine each guess to a precise point.
  const refinedPoints: MathPoint[] = initialGuesses
    .map((guess) => {
      let x = guess;
      // Iterate to "slide down" the derivative to the root.
      for (let i = 0; i < 10; i++) {
        const yA = labA.getY(x);
        const yB = labB.getY(x);
        if (yA === null || yB === null) break;

        const f_x = yA - yB; // The function we want to find the root of (where it equals zero)

        const slopeA = labA.getSlope(x);
        const slopeB = labB.getSlope(x);
        if (slopeA === null || slopeB === null) break;

        const f_prime_x = slopeA - slopeB; // The derivative of our difference function
        if (Math.abs(f_prime_x) < 1e-9) break; // Avoid division by zero (happens at parallel slopes)

        x = x - f_x / f_prime_x; // Newton's step
      }
      const finalY = labA.getY(x);
      return finalY !== null ? { x, y: finalY } : null;
    })
    .filter((p): p is MathPoint => p !== null);

  // 3. Validation "Domain Guard" Phase: Filter out any "ghost points".
  const validatedIntersections: MathPoint[] = [];
  const seen = new Set<string>();

  for (const p of refinedPoints) {
    const yA = labA.getY(p.x);
    const yB = labB.getY(p.x);

    // Both points must be valid (not null).
    if (yA === null || yB === null) continue;

    // The "Guardrail": If the Y-values aren't almost identical, it's a false positive.
    if (Math.abs(yA - yB) < 0.001) {
      const key = p.x.toFixed(4);
      if (!seen.has(key)) {
        validatedIntersections.push({ x: p.x, y: yA });
        seen.add(key);
      }
    }
  }

  return validatedIntersections;
}