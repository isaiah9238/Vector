/**
 * Maps a real-world elapsed time to a parametric t value.
 * @param elapsedTime - Seconds since scan start.
 * @param totalDuration - Total planned scan time.
 */
export const getTimeParameter = (
  elapsedTime: number, 
  totalDuration: number
): number => {
  return Math.min(Math.max(elapsedTime / totalDuration, 0), 1);
};