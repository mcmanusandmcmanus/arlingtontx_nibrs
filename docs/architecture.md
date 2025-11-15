# Arlington PD Data Empowerment Platform

## Mission & Personas
- **Audience**: field officers, crime analysts, command staff, invited civic partners, and public observers.
- **Goals**: frictionless uploads, transparent refresh status, tactical dashboards with univariate/multivariate EDA, ML-driven trend detection, and GIS context.
- **Personas**
  - **Officer Uploaders**: authenticated users that paste or upload XLSX/CSV tables, monitor refresh progress, and view beat KPIs.
  - **Command Staff**: consume district scorecards, anomaly alerts, ML projections, and upload audit trails.
  - **External Observers**: request accounts, consume curated dashboards, and submit data contributions.

## Geographic Context
- Arlington consists of 4 districts × 8 beats. The landing page presents an interactive district selector that routes to `/district/[districtSlug]`.
- Each district dashboard contains beat switchers, GIS overlays (district polygons via ArcGIS feature layers), and KPI cards scoped to the current geography.

## Data Pipeline Overview
1. **Ingest**: officers upload Excel/CSV or paste tabular data into `/api/upload/`. Accepted schema is auto-detected; column mapper assists manual fixes.
2. **Versioning**: uploads create `DataAsset` rows (PostgreSQL) plus parquet snapshots in `media/uploads/{district}/{timestamp}`.
3. **Refresh Job**: a single refresh worker processes queued assets sequentially (ensures “single refresh job only” requirement). Officers manually click “Process latest upload” which triggers `/api/refresh/`.
4. **Processing Stages**
   - Validation (schema match, data quality checks).
   - Feature engineering (temporal fields, violent crime flags, rolling windows).
   - Analytics materialization (EDA metrics JSON, trend tables, anomaly statistics, ML artifacts).
   - GIS enrichment (beat shape join, map-ready GeoJSON cache).
5. **Serving**: analytics artifacts stored in PostgreSQL JSONB plus parquet; ML models persisted via `joblib`. Frontend fetches via REST endpoints.

## Technology Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts + Mapbox GL.
- **Backend**: Django 5 + Django REST Framework + PostgreSQL + Celery (single worker) + Redis (queue) + pandas + scikit-learn + statsmodels.
- **Storage**: AWS S3-compatible bucket for uploads/artifacts (local filesystem fallback).
- **Auth**: DRF JWT (simplejwt). Roles: `officer`, `analyst`, `command`, `observer`, `admin`.
- **CI/CD**: GitHub Actions for lint/test/build; container images built via Docker; IaC ready for Kubernetes or ECS.

## Security Model
- JWT auth backed by Django `User` + `Profile`.
- Role-based permissions enforced per endpoint/component.
- Upload ACL ensures officers can modify only district(s) assigned.
- Audit logs track uploads, refresh triggers, model publishes.
- HTTPS enforced; secrets managed via environment.

## Backend Modules
```
backend/
  manage.py
  config/
  api/
    auth/ (JWT endpoints)
    uploads/
    analytics/
    eda/
    ml/
  analytics_core/
    ingestion.py
    validation.py
    eda.py
    modeling.py
    geo.py
```
- **Uploads API**: `/api/upload/`, `/api/uploads/<id>/status/`, `/api/uploads/<id>/preview/`
- **Refresh**: `/api/refresh/` (manual trigger), `/api/refresh-status/`
- **Analytics**: `/api/districts/<district>/overview/`, `/api/districts/<district>/beats/<beat>/kpis/`, `/api/districts/<district>/eda/<column>/`
- **ML**: `/api/districts/<district>/models/` returning tuned/untuned scikit-learn runs (RandomForest, XGBoost, Prophet-like time-series via statsmodels SARIMAX).
- **GIS**: `/api/districts/<district>/geometry/` merges ArcGIS sources cached nightly.

## Frontend Layout
- **Home**: hero summary, “Select district” map, KPI sparkline, call-to-action for account requests.
- **District Shell**: tabs — Overview, EDA (univariate/multivariate sub-tabs), ML Lab, Upload Center, Anomalies, Map.
- **Upload Center**: drag-drop zone, paste-enabled table, schema validator, job timeline, refresh button, GitHub publish indicator.
- **EDA Tab**:
  - Column selector listing all 14 columns (extends if schema updates).
  - For each column: type detection, distribution chart (histogram/bar), stats (mean, median, mode, missingness).
  - Multivariate cards: correlations (Pearson/Spearman), heatmaps, temporal decomposition, cross tab between `Crime_Category`/`Beats`.
- **ML Lab**:
  - Model gallery (untuned baseline vs tuned advanced).
  - Metrics table (accuracy, F1, ROC-AUC, RMSE depending on target).
  - Data leakage guard + train/val/test splits overview.
  - Model comparison charts, feature importance, shap summary.
- **Map Tab**: Mapbox map overlayed with district + beat boundaries from provided ArcGIS URLs and color-coded KPIs.

## Column-Level EDA Coverage
| Column | Type | Univariate Views | Multivariate Views |
| --- | --- | --- | --- |
| Case Number | categorical | distinct count, duplication check | linked to crime category & temporal anomalies |
| District | categorical | share by district | district × beat cross filter |
| Date/Time Occurred | datetime | trend line, seasonality decomposition | vs crime category/hour heatmap |
| Description | categorical | top offense list, word cloud | vs violent flag |
| Beats | categorical | beat distribution | beat × day-of-week |
| Hour | numeric | histogram | vs violent flag/time of week |
| Year | numeric | yoy trend | vs violent flag |
| Month | categorical | seasonal wheel | vs beat |
| Year_Month | categorical | timeline chart | vs crime category |
| Day | numeric | day-of-month density | vs violent flag |
| Day_char | categorical | weekday bar | vs beat/time |
| Week_num | numeric | weekly rolling stats | vs violent flag |
| Crime_Category | categorical | share, stacked bar | vs DKPIs |
| Violent_Crime_excl09A | boolean | violent vs non-violent share | vs hour/beat/district |

## Officer Workflow & Refresh Logic
1. Officer logs in → sees assigned districts.
2. Upload page allows paste/CSV/XLSX; validation results shown before queuing.
3. Officer optionally adds metadata (source URL, notes).
4. After uploading, they hit “Submit for refresh” which creates a job in `RefreshQueue` (only one active job). Frontend polls `/api/refresh-status/`.
5. Once job finishes, GitHub Pages/Render deployment notes are updated manually but tracked via status toggle that officers set once publishing is done.

## Scaling Strategy
- Multi-tenant architecture via `Organization` + `District` models.
- Configuration template so hundreds of deployments reuse infrastructure as code.
- Observability via OpenTelemetry (metrics/traces) and structured logs.

## Map Sources
- District geometry: `https://services.arcgis.com/jXi5GuMZwfCYtZP9/arcgis/rest/services/Arlington_Police_Districts/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson`
- Beat polygons: `https://gis2.arlingtontx.gov/agsext2/rest/services/OpenData/OD_PoliticalBoundary/MapServer/1/query?outFields=*&where=1%3D1&f=geojson`
- Cached nightly via cron job; served via `/api/geo/districts` & `/api/geo/beats`.

## Testing Strategy
- Unit tests for ingestion, validation, EDA calculators, ML training utilities, and REST endpoints.
- Cypress component tests for dashboards.
- Integration tests for upload→refresh→dashboard flow using fixture spreadsheets.

