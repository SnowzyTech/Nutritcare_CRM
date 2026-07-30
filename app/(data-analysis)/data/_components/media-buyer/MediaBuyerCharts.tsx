'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  MediaBuyerProductLine,
  MediaBuyerTrendPoint,
} from '@/modules/data-analysis/services/media-buyer-analysis.service';

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartPanel({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <p className="text-sm font-black text-gray-800">{title}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">{legend}</div>
      </div>
      {children}
    </div>
  );
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #f1f5f9',
  fontSize: 12,
} as const;

/**
 * Leads vs delivered over the selected window. Unlike the media buyer's own
 * dashboard (whose trend line is a hardcoded zero scaffold), this is fed by
 * real per-bucket counts from getMediaBuyerAnalytics.
 */
export function MediaBuyerTrendChart({
  points,
  rangeLabel,
}: {
  points: MediaBuyerTrendPoint[];
  rangeLabel: string;
}) {
  return (
    <ChartPanel
      title="Conversion Trend"
      subtitle={rangeLabel}
      legend={
        <>
          <LegendDot color="#f59e0b" label="Leads" />
          <LegendDot color="#A020F0" label="Delivered" />
        </>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            minTickGap={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={30}
            allowDecimals={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="leads" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="delivered" stroke="#A020F0" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

/** Views / leads / delivered per product line, stacked. */
export function MediaBuyerProductChart({
  productLines,
}: {
  productLines: MediaBuyerProductLine[];
}) {
  return (
    <ChartPanel
      title="Product Overview"
      subtitle="Per product line"
      legend={
        <>
          <LegendDot color="#e9d5ff" label="Views" />
          <LegendDot color="#c084fc" label="Leads" />
          <LegendDot color="#7c3aed" label="Delivered" />
        </>
      }
    >
      {productLines.length === 0 ? (
        <p className="text-sm text-gray-400 py-14 text-center">
          No products linked to this buyer&apos;s forms yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={productLines.slice(0, 6)}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              width={30}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="views" stackId="a" fill="#e9d5ff" barSize={20} />
            <Bar dataKey="leads" stackId="a" fill="#c084fc" barSize={20} />
            <Bar dataKey="delivered" stackId="a" fill="#7c3aed" radius={[3, 3, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
