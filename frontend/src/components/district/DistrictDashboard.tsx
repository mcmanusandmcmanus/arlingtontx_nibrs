"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";

import { useAuth } from "@/context/auth-context";
import {
  fetchBeatGeo,
  fetchDistrictGeo,
  fetchModelResults,
  fetchRefreshStatus,
  fetchSnapshot,
  listUploads,
  triggerRefresh,
  uploadDataAsset,
} from "@/lib/api";
import type { AnalyticsSnapshot, ModelResult, RefreshJob, UploadAsset } from "@/types";

import EdaTab from "./EdaTab";
import GeoPanel from "./GeoPanel";
import ModelTab from "./ModelTab";
import OverviewTab from "./OverviewTab";
import UploadCenter from "./UploadCenter";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "eda", label: "EDA" },
  { id: "models", label: "ML Lab" },
  { id: "uploads", label: "Upload Center" },
  { id: "map", label: "GIS" },
];

interface Props {
  slug: string;
}

type GeoBundle = { districts: FeatureCollection; beats: FeatureCollection };

interface Insights {
  violentPercentage: number;
}

export default function DistrictDashboard({ slug }: Props) {
  const { accessToken, profile } = useAuth();
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [uploads, setUploads] = useState<UploadAsset[]>([]);
  const [refreshJob, setRefreshJob] = useState<RefreshJob | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<GeoBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        setLoading(true);
        const [snapshotRes, uploadsRes, refreshRes, modelsRes] = await Promise.all([
          fetchSnapshot(slug, accessToken),
          listUploads(accessToken),
          fetchRefreshStatus(accessToken),
          fetchModelResults(slug, accessToken),
        ]);
        setSnapshot(snapshotRes);
        const normalizedUploads = (uploadsRes.results ?? uploadsRes) as UploadAsset[];
        setUploads(normalizedUploads);
        setRefreshJob((refreshRes as RefreshJob) ?? null);
        setModelResults((modelsRes.models ?? modelsRes) as ModelResult[]);
        const [districtGeo, beatGeo] = await Promise.all([fetchDistrictGeo(), fetchBeatGeo()]);
        setGeo({
          districts: districtGeo as FeatureCollection,
          beats: beatGeo as FeatureCollection,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, slug]);

  async function handleRefresh() {
    if (!accessToken) return;
    const job = await triggerRefresh(accessToken);
    setRefreshJob(job as RefreshJob);
  }

  async function handleUpload(payload: FormData | Record<string, unknown>) {
    if (!accessToken) return;
    await uploadDataAsset(accessToken, payload);
    const uploadsRes = await listUploads(accessToken);
    setUploads((uploadsRes.results ?? uploadsRes) as UploadAsset[]);
  }

  const latestUpload = uploads[0];
  const insights = useMemo<Insights | null>(() => {
    if (!snapshot) return null;
    const violentColumn = snapshot.eda_payload["Violent_Crime_excl09A"] ?? snapshot.eda_payload["target_binary"];
    const violentRate = violentColumn?.top_values
      ? violentColumn.top_values.find((item) => item.label === "1" || item.label === "Violent")
      : null;
    return {
      violentPercentage: violentRate ? violentRate.count / Math.max(violentColumn.non_null, 1) : 0,
    };
  }, [snapshot]);

  if (!accessToken) {
    return (
      <div className="mx-auto mt-20 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-card">
        <h2 className="text-3xl font-semibold text-white">Authentication required</h2>
        <p className="mt-4 text-slate-300">
          Login to view the {slug.toUpperCase()} district dashboard, upload spreadsheets, and inspect the ML lab.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-8 px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-200">District {slug.toUpperCase()}</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-4xl font-semibold text-white">Officer collaboration hub</h1>
          {profile && (
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
              {profile.user?.first_name} - {profile.role}
            </p>
          )}
        </div>
        {latestUpload && (
          <p className="mt-2 text-sm text-slate-400">
            Latest upload - {latestUpload.status} - {new Date(latestUpload.created_at).toLocaleString()}
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              selectedTab === tab.id ? "bg-brand-500 text-white" : "border border-white/10 text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-300">Loading district intelligence...</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {!loading && snapshot && (
        <>
          {selectedTab === "overview" && <OverviewTab snapshot={snapshot} latestUpload={latestUpload} insights={insights} />}
          {selectedTab === "eda" && <EdaTab snapshot={snapshot} />}
          {selectedTab === "models" && <ModelTab models={modelResults.length ? modelResults : snapshot.ml_payload.models} />}
          {selectedTab === "uploads" && (
            <UploadCenter
              slug={slug}
              uploads={uploads}
              refreshJob={refreshJob}
              onRefresh={handleRefresh}
              onUpload={handleUpload}
            />
          )}
          {selectedTab === "map" && geo && snapshot && <GeoPanel districtSlug={slug} snapshot={snapshot} geo={geo} />}
        </>
      )}
    </div>
  );
}
