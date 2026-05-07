'use client';

import type { ChartPoint } from '@/lib/supabase/admin';

interface ChartsProps {
  listingsData: ChartPoint[];
  revenueData: ChartPoint[];
}

function AreaChart({ data, color = '#F97316', fill = '#FED7AA', label }: {
  data: ChartPoint[];
  color?: string;
  fill?: string;
  label: string;
}) {
  const W = 480;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-stone-400 dark:text-slate-500 text-sm">
        No data yet
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;

  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const points = data.map((d, i) => [toX(i), toY(d.value)] as [number, number]);
  const pathD =
    `M ${points[0][0]} ${points[0][1]}` +
    points.slice(1).map(([x, y]) => ` L ${x} ${y}`).join('');

  const areaD =
    pathD +
    ` L ${points[points.length - 1][0]} ${PAD.top + innerH}` +
    ` L ${points[0][0]} ${PAD.top + innerH} Z`;

  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  const xStep = Math.ceil(data.length / 5);
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <div>
      <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label={label}>
        {/* Y grid lines */}
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={toY(v)} x2={PAD.left + innerW} y2={toY(v)}
              stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 3"
            />
            <text x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {v}
            </text>
          </g>
        ))}
        {/* Area fill */}
        <path d={areaD} fill={fill} fillOpacity={0.5} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill={color} />
        ))}
        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data, color = '#F97316', label, formatY }: {
  data: ChartPoint[];
  color?: string;
  label: string;
  formatY?: (v: number) => string;
}) {
  const W = 480;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-stone-400 dark:text-slate-500 text-sm">
        No data yet
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatY ?? ((v) => String(v));
  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  const barW = Math.max((innerW / data.length) * 0.6, 4);
  const gap = innerW / data.length;

  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;
  const toH = (v: number) => (v / maxVal) * innerH;

  const xStep = Math.ceil(data.length / 5);
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <div>
      <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label={label}>
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={toY(v)} x2={PAD.left + innerW} y2={toY(v)}
              stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 3"
            />
            <text x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {fmt(v)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * gap + gap / 2 - barW / 2;
          const y = toY(d.value);
          const h = toH(d.value);
          return (
            <rect key={i} x={x} y={y} width={barW} height={Math.max(h, 1)} rx={3} fill={color} fillOpacity={0.85} />
          );
        })}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          const x = PAD.left + idx * gap + gap / 2;
          return (
            <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function Charts({ listingsData, revenueData }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-slate-700">
        <AreaChart data={listingsData} label="Listings — last 30 days" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-slate-700">
        <BarChart
          data={revenueData}
          label="Revenue (UGX) — last 30 days"
          formatY={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
      </div>
    </div>
  );
}
