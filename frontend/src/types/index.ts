export interface Beat {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface District {
  id: number;
  name: string;
  slug: string;
  description: string;
  beats: Beat[];
}

export interface ColumnMetrics {
  dtype: string;
  non_null: number;
  null_pct: number;
  unique: number;
  stats?: Record<string, number>;
  histogram?: { bins: number[]; counts: number[] };
  top_values?: { label: string; count: number }[];
}

export interface ModelResult {
  name: string;
  tuned: boolean;
  parameters: Record<string, unknown>;
  metrics: {
    validation: Record<string, number>;
    test: Record<string, number>;
  };
  feature_importances: { feature: string; importance: number }[];
}

export interface AnalyticsSnapshot {
  id: string;
  eda_payload: Record<string, ColumnMetrics>;
  multivariate_payload: {
    correlations: Record<string, number | string>[];
    monthly_counts: { Year_Month: string; count: number }[];
    hourly_breakdown: Record<string, number>[];
    beat_vs_weekday: Record<string, number>[];
  };
  ml_payload: {
    target: string;
    feature_columns: string[];
    split_counts: Record<string, number>;
    models: ModelResult[];
  };
  anomalies_payload: {
    anomalies: {
      "Case Number": string;
      "Date/Time Occurred": string;
      Beats: string;
      Crime_Category: string;
      anomaly_score: number;
    }[];
  };
  generated_at: string;
}

export interface UploadAsset {
  id: string;
  district: string;
  status: string;
  row_count: number;
  created_at: string;
  processed_at?: string;
}

export interface RefreshJob {
  id: string;
  status: string;
  started_at?: string;
  finished_at?: string;
  note?: string;
}

export interface OfficerProfile {
  id: number;
  role: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  [key: string]: unknown;
}
