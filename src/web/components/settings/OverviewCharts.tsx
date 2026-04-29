import React from "react";

interface OverviewChartsProps {
    data: { name: string, value: number }[];
    type: "messages" | "members";
    color: string;
}

export default function OverviewCharts({ data, type, color }: OverviewChartsProps) {
    if (!data || data.length === 0) return null;

    const width = 400;
    const height = 150;
    const padding = 20;

    const values = data.map(d => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.value - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `
        ${padding},${height} 
        ${points} 
        ${width - padding},${height}
    `;

    return (
        <div className="h-[200px] w-full flex items-center justify-center p-4">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0, 0.5, 1].map((v, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + (v * (height - padding * 2))}
                        x2={width - padding}
                        y2={padding + (v * (height - padding * 2))}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Area under the line */}
                <polyline
                    points={areaPoints}
                    fill={`url(#gradient-${type})`}
                    className="transition-all duration-700"
                />

                {/* The line itself */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-700"
                />

                {/* Data Points */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
                    const y = height - ((d.value - min) / range) * (height - padding * 2) - padding;
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#1a1c1e"
                            stroke={color}
                            strokeWidth="2"
                            className="transition-all duration-700"
                        />
                    );
                })}
            </svg>
        </div>
    );
}
