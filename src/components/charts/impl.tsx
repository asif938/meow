"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Point = { label: string; value: number };
export type MultiPoint = { label: string } & Record<string, number | string>;

// Only the three brand hues (orange, teal, neutral) plus lighter tints of them.
export const COLORS = ["#ea580c", "#0f766e", "#a8a29e", "#fdba74", "#5eead4", "#78716c"];

const tick = { fill: "var(--color-muted)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 12,
  color: "var(--color-ink)",
  fontSize: 12,
};

export function BarImpl({ data, unit }: { data: Point[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-brand-50)" }} formatter={(v) => [`${v}${unit ? ` ${unit}` : ""}`, ""]} separator="" />
        <Bar dataKey="value" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineImpl({ data, series }: { data: MultiPoint[]; series: { key: string; name: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={COLORS[i % 2]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieImpl({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="52%" outerRadius="80%" paddingAngle={2} stroke="var(--color-surface)">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
