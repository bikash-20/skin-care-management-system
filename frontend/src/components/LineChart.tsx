import { useMemo } from 'react';

interface Point { x: string; y: number | null; }

interface Props {
    points: Point[];
    width?: number;
    height?: number;
    label?: string;
    yMax?: number;
    yMin?: number;
}

/**
 * Tiny SVG line chart, no external dependency.
 * Skips nulls by breaking the line.
 */
export default function LineChart({ points, width = 600, height = 220, label, yMax = 5, yMin = 1 }: Props) {
    const padding = { top: 20, right: 20, bottom: 30, left: 36 };
    const w = width - padding.left - padding.right;
    const h = height - padding.top - padding.bottom;

    const xs = points.map((_, i) => i);
    const ys = points.map((p) => p.y).filter((v): v is number => v != null);
    const yRange = yMax - yMin;
    const scaleX = (i: number) => (xs.length <= 1 ? w / 2 : (i / (xs.length - 1)) * w);
    const scaleY = (v: number) => h - ((v - yMin) / yRange) * h;

    // Build path segments split by nulls
    const segments = useMemo(() => {
        const segs: Array<Array<{ x: number; y: number }>> = [];
        let current: Array<{ x: number; y: number }> = [];
        points.forEach((p, i) => {
            if (p.y == null) {
                if (current.length) segs.push(current);
                current = [];
            } else {
                current.push({ x: scaleX(i), y: scaleY(p.y) });
            }
        });
        if (current.length) segs.push(current);
        return segs;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points]);

    const gridYs = [yMin, yMin + (yRange / 2), yMax];

    return (
        <svg
            className="chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label ?? 'Chart'}
            preserveAspectRatio="xMidYMid meet"
        >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
                {gridYs.map((y) => (
                    <g key={y}>
                        <line x1={0} y1={scaleY(y)} x2={w} y2={scaleY(y)} stroke="#e5e7eb" />
                        <text x={-8} y={scaleY(y) + 4} fontSize="10" textAnchor="end" fill="#6b7280">
                            {y}
                        </text>
                    </g>
                ))}
                {segments.map((seg, idx) => (
                    <polyline
                        key={idx}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth={2}
                        points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                ))}
                {segments.flatMap((seg, segIdx) => seg.map((p, i) => (
                    <circle key={`${segIdx}-${i}`} cx={p.x} cy={p.y} r={3} fill="#a855f7" />
                )))}
                {points.map((p, i) => (
                    <text
                        key={i}
                        x={scaleX(i)}
                        y={h + 16}
                        fontSize="10"
                        textAnchor="middle"
                        fill="#6b7280"
                    >
                        {p.x.slice(5)}
                    </text>
                ))}
            </g>
        </svg>
    );
}