import type { ModelResult } from "@/types";

interface Props {
  models: ModelResult[];
}

export default function ModelTab({ models }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {models.map((model) => (
        <div key={model.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-200">{model.tuned ? "Tuned" : "Baseline"}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{model.name}</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-200">
            {Object.entries(model.metrics.validation).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="uppercase tracking-[0.3em] text-slate-400">{metric}</span>
                <span className="font-semibold">{value.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h4 className="text-sm uppercase tracking-[0.3em] text-slate-400">Top features</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {model.feature_importances.slice(0, 5).map((feature) => (
                <li key={feature.feature} className="flex items-center justify-between">
                  <span className="w-48 truncate">{feature.feature}</span>
                  <span className="text-brand-200">{feature.importance.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
