import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsSnapshot, UploadAsset } from "@/types";

interface Props {
  snapshot: AnalyticsSnapshot;
  latestUpload?: UploadAsset;
  insights: { violentPercentage: number } | null;
}

export default function OverviewTab({ snapshot, latestUpload, insights }: Props) {
  const monthly = snapshot.multivariate_payload.monthly_counts?.map((item) => ({
    name: item.Year_Month,
    count: item.count,
  }));
  const hourly = snapshot.multivariate_payload.hourly_breakdown ?? [];
  const categoryKeys = Object.keys(hourly[0] ?? {}).filter((key) => key !== "Hour");
  const anomalies = snapshot.anomalies_payload.anomalies ?? [];

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Records in latest upload</p>
          <p className="mt-2 text-4xl font-semibold text-white">{latestUpload?.row_count ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Violent share</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {insights?.violentPercentage
              ? `${(insights.violentPercentage * 100).toFixed(1)}%`
              : "Calculating..."}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Features analyzed</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {Object.keys(snapshot.eda_payload).length}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Snapshot generated</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {new Date(snapshot.generated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Monthly incidents</h3>
              <p className="text-sm text-slate-400">Trendline + rolling average</p>
            </div>
            <span className="rounded-full border border-white/10 px-4 py-1 text-xs text-slate-300">
              Data science ready
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#33a9ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#33a9ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#33a9ff" fillOpacity={1} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Crime category by hour</h3>
          <p className="text-sm text-slate-400">Heat-coded bar stacks</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3b" />
                <XAxis dataKey="Hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                {categoryKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={idx % 2 === 0 ? "#33a9ff" : "#f59f00"}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Anomaly board</h3>
          <p className="text-sm text-slate-400">Isolation Forest highlights the most unusual cases.</p>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2 pr-4">Case</th>
                <th className="py-2 pr-4">Date/Time</th>
                <th className="py-2 pr-4">Beat</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((anomaly) => (
                <tr key={anomaly["Case Number"]} className="border-b border-white/5 text-slate-200">
                  <td className="py-2 pr-4">{anomaly["Case Number"]}</td>
                  <td className="py-2 pr-4">{anomaly["Date/Time Occurred"]}</td>
                  <td className="py-2 pr-4">{anomaly["Beats"]}</td>
                  <td className="py-2 pr-4">{anomaly["Crime_Category"]}</td>
                  <td className="py-2 pr-4 text-right">{anomaly["anomaly_score"].toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
