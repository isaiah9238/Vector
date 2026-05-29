export const calculateShapeArea = (points: { x: number; y: number }[]): { sqft: number; acres: number } => {
    if (!points || points.length < 3) return { sqft: 0, acres: 0 };
    let sum1 = 0, sum2 = 0;
    for (let i = 0; i < points.length - 1; i++) {
        sum1 += points[i].x * points[i+1].y;
        sum2 += points[i].y * points[i+1].x;
    }
    const first = points[0]; const last = points[points.length - 1];
    if (first.x !== last.x || first.y !== last.y) { sum1 += last.x * first.y; sum2 += last.y * first.x; }
    const sqft = Math.abs(0.5 * (sum1 - sum2));
    return { sqft, acres: sqft / 43560 };
};

export const calculateArcPoints = (
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}, 
    p3: {x: number, y: number},
    steps: number = 30
) => {
    const { x: x1, y: y1 } = p1; const { x: x2, y: y2 } = p2; const { x: x3, y: y3 } = p3;
    const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    if (Math.abs(D) < 1e-6) return [p1, p3];
    
    const h = ((x1**2 + y1**2) * (y2 - y3) + (x2**2 + y2**2) * (y3 - y1) + (x3**2 + y3**2) * (y1 - y2)) / D;
    const k = ((x1**2 + y1**2) * (x3 - x2) + (x2**2 + y2**2) * (x1 - x3) + (x3**2 + y3**2) * (x2 - x1)) / D;
    const r = Math.sqrt((x1 - h)**2 + (y1 - k)**2);
    
    const startAng = Math.atan2(p1.y - k, p1.x - h);
    const endAng = Math.atan2(p3.y - k, p3.x - h);
    const isCCW = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x) > 0;
    
    let diff = endAng - startAng;
    if (isCCW && diff < 0) diff += Math.PI * 2;
    if (!isCCW && diff > 0) diff -= Math.PI * 2;
    
    return Array.from({ length: steps + 1 }).map((_, i) => {
        const t = i / steps;
        const currentAng = startAng + diff * t;
        const tangentAzimuth = isCCW ? Math.atan2(Math.cos(currentAng), Math.sin(currentAng)) - Math.PI / 2 : Math.atan2(Math.cos(currentAng), Math.sin(currentAng)) + Math.PI / 2;
        return { x: h + r * Math.cos(currentAng), y: k + r * Math.sin(currentAng), bearing: tangentAzimuth };
    });
};