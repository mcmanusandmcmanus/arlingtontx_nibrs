"use client";

import { FormEvent, useState } from "react";
import Papa from "papaparse";

import type { RefreshJob, UploadAsset } from "@/types";

interface Props {
  slug: string;
  uploads: UploadAsset[];
  refreshJob: RefreshJob | null;
  onUpload: (payload: FormData | Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function UploadCenter({ slug, uploads, refreshJob, onUpload, onRefresh }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(event: FormEvent<HTMLInputElement>) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("district", slug);
    formData.append("source_file", file);
    setLoading(true);
    await onUpload(formData);
    setLoading(false);
    setStatus("File uploaded. Trigger refresh to rebuild analytics.");
  }

  async function handleClipboardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = formData.get("clipboard-data") as string;
    if (!raw) return;
    const parsed = Papa.parse(raw.trim(), { header: true });
    try {
      setLoading(true);
      await onUpload({
        district: slug,
        data_payload: parsed.data,
        input_format: "clipboard",
      });
      setStatus("Clipboard data queued. Trigger refresh to publish.");
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold text-white">Upload center</h3>
        <p className="text-sm text-slate-300">
          Paste the table from the open data portal or upload XLSX/CSV exports. Schema validation is automatic.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block rounded-2xl border border-dashed border-white/20 p-4 text-center text-sm text-slate-300">
            Drag & drop or click to upload
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileChange} />
          </label>
          <form onSubmit={handleClipboardSubmit} className="space-y-2">
            <textarea
              name="clipboard-data"
              rows={8}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100"
              placeholder="Paste rows directly from Excel..."
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-500 py-3 font-semibold text-white disabled:opacity-50"
            >
              Queue clipboard data
            </button>
          </form>
          {status && <p className="text-sm text-slate-200">{status}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Refresh status</h3>
            <p className="text-sm text-slate-400">
              Single refresh jobs keep the team aligned. Publish toggle tracked manually.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white hover:border-brand-300"
          >
            Trigger refresh
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-300">Status</p>
          <p className="text-3xl font-semibold text-white">{refreshJob?.status ?? "Idle"}</p>
          {refreshJob?.started_at && (
            <p className="text-xs text-slate-400">
              Started {new Date(refreshJob.started_at).toLocaleString()} - Finished{" "}
              {refreshJob.finished_at ? new Date(refreshJob.finished_at).toLocaleString() : "—"}
            </p>
          )}
        </div>
        <div className="mt-6">
          <h4 className="text-sm uppercase tracking-[0.3em] text-slate-400">Upload log</h4>
          <div className="mt-3 max-h-64 overflow-auto text-sm text-slate-200">
            {uploads.slice(0, 6).map((upload) => (
              <div key={upload.id} className="border-b border-white/5 py-2">
                <p className="font-semibold">{upload.status}</p>
                <p className="text-xs text-slate-400">{new Date(upload.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
