"use client";

import { useMemo, useState } from "react";

import type { AnalyticsSnapshot, ColumnMetrics } from "@/types";

interface Props {
  snapshot: AnalyticsSnapshot;
}

export default function EdaTab({ snapshot }: Props) {
  const columns = useMemo(() => Object.entries(snapshot.eda_payload), [snapshot]);
  const [activeColumn, setActiveColumn] = useState<string>(columns[0]?.[0]);

  const activeMetrics: ColumnMetrics | undefined = activeColumn
    ? snapshot.eda_payload[activeColumn]
    : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
      <aside className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        {columns.map(([name]) => (
          <button
            key={name}
            onClick={() => setActiveColumn(name)}
            className={`rounded-2xl px-4 py-2 text-left text-sm ${
              name === activeColumn ? "bg-brand-500 text-white" : "bg-white/5 text-slate-200"
            }`}
          >
            {name}
          </button>
        ))}
      </aside>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {activeMetrics ? (
          <>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-brand-200">Column</p>
                <h3 className="text-3xl font-semibold text-white">{activeColumn}</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <div>
                  <p className="text-slate-400">Type</p>
                  <p className="text-white">{activeMetrics.dtype}</p>
                </div>
                <div>
                  <p className="text-slate-400">Missing %</p>
                  <p className="text-white">{activeMetrics.null_pct.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-slate-400">Unique</p>
                  <p className="text-white">{activeMetrics.unique}</p>
                </div>
              </div>
            </div>
            {activeMetrics.stats && (
              <div className="mt-6 grid gap-2 text-sm text-slate-100 sm:grid-cols-3">
                {Object.entries(activeMetrics.stats).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-200">{label}</p>
                    <p className="text-lg font-semibold">{value.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
            {activeMetrics.top_values && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white">Top values</h4>
                <div className="mt-3 space-y-2">
                  {activeMetrics.top_values.map((row) => (
                    <div key={row.label} className="flex items-center gap-3 text-sm text-slate-100">
                      <div className="w-48 truncate">{row.label}</div>
                      <div className="flex-1 rounded-full bg-white/10">
                        <div
                          className="rounded-full bg-brand-500 py-1 text-xs text-white"
                          style={{ width: `${row.count / (activeMetrics.non_null || 1) * 100}%` }}
                        />
                      </div>
                      <span>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeMetrics.histogram && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white">Histogram</h4>
                <div className="mt-2 flex items-end gap-1 text-brand-400">
                  {activeMetrics.histogram.counts.map((count, idx) => (
                    <div
                      key={idx}
                      className="w-full rounded-t-full bg-brand-500/60"
                      style={{
                        height: `${(count / Math.max(...activeMetrics.histogram!.counts)) * 120}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-300">Select a column to inspect metrics.</p>
        )}
      </section>
    </div>
  );
}
