"use client";

import type { Feature, FeatureCollection } from "geojson";
import Map, { Layer, Source } from "react-map-gl";

import type { AnalyticsSnapshot } from "@/types";
import { MAPBOX_TOKEN } from "@/lib/config";

interface Props {
  districtSlug: string;
  snapshot: AnalyticsSnapshot;
  geo: { districts: FeatureCollection; beats: FeatureCollection };
}

export default function GeoPanel({ districtSlug, snapshot, geo }: Props) {
  const beatAgg = snapshot.multivariate_payload.beat_vs_weekday ?? [];
  const beatTotals: Record<string, number> = {};
  beatAgg.forEach((row: Record<string, number | string>) => {
    const beatName = row["Beats"] as string;
    const total = Object.entries(row)
      .filter(([key]) => key !== "Beats")
      .reduce((acc, [, value]) => acc + Number(value), 0);
    beatTotals[beatName] = total;
  });

  const beatGeoJSON: FeatureCollection = {
    ...geo.beats,
    features: (geo.beats.features as Feature[]).map((feature) => {
      const code =
        (feature.properties?.DISTRICT_B as string) ??
        (feature.properties?.BEAT as string) ??
        (feature.properties?.DISTRICT as string) ??
        "";
      return {
        ...feature,
        properties: {
          ...feature.properties,
          intensity: beatTotals[code] ?? 0,
        },
      };
    }),
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">District map</p>
        <h3 className="text-3xl font-semibold text-white">{districtSlug.toUpperCase()} - incidents by beat</h3>
      </div>
      <div className="h-[500px] overflow-hidden rounded-3xl border border-white/10">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          initialViewState={{ longitude: -97.1081, latitude: 32.7357, zoom: 11 }}
        >
          <Source id="districts" type="geojson" data={geo.districts}>
            <Layer
              id="district-outline"
              type="line"
              paint={{ "line-color": "#33a9ff", "line-width": 2 }}
            />
          </Source>
          <Source id="beats" type="geojson" data={beatGeoJSON}>
            <Layer
              id="beats-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "intensity"],
                  0,
                  "#0e6fb3",
                  20,
                  "#33a9ff",
                  60,
                  "#f59f00",
                ],
                "fill-opacity": 0.5,
              }}
            />
            <Layer
              id="beats-outline"
              type="line"
              paint={{ "line-color": "#ffffff", "line-width": 1 }}
            />
          </Source>
        </Map>
      </div>
    </div>
  );
}
