# Arlington PD Data Empowerment Platform

Full-stack blueprint that gives officers, analysts, and command staff a single surface to upload spreadsheets, run statistical + ML workflows, and visualize GIS overlays for every district/beat.

## Repository layout

```
.
├── backend/                # Django + DRF API, Celery-ready refresh hooks
├── frontend/               # Next.js + Tailwind + Recharts officer dashboard
├── docs/                   # Architecture notes and workflow playbooks
└── East_District_...xlsx   # Seed dataset used by the initial deployment
```

## Backend (Django REST + analytics)

1. `cd backend`
2. `python -m venv .venv && .\.venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. Seed the provided XLSX and build analytics snapshots:
   ```
   python manage.py seed_sample_asset --district=east
   ```
6. Run the API locally:
   ```
   python manage.py runserver
   ```

### Key endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/token/` | Obtain JWT login tokens |
| `GET/POST /api/accounts/requests/` | Public account requests + admin review |
| `GET /api/analytics/districts/<slug>/snapshot/` | Latest EDA + ML payload per district |
| `POST /api/uploads/` | Upload XLSX/CSV or clipboard JSON |
| `POST /api/uploads/refresh/` | Manual single refresh job trigger |
| `GET /api/geo/districts` & `/beats` | Cached ArcGIS GeoJSON feeds |

The refresh worker (`apps/uploads/services.py`) converts uploads into pandas DataFrames, infers schema, and calls `apps.analytics.services.build_snapshot_for_asset` to persist EDA, multivariate stats, anomaly detection, and multiple scikit-learn models (baseline logistic, tuned random forest, tuned gradient boosting).

## Frontend (Next.js 16 + Tailwind 3)

1. `cd frontend`
2. `cp .env.example .env.local` and set:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
   - `NEXT_PUBLIC_MAPBOX_TOKEN=<Mapbox token>`
3. `npm install`
4. `npm run dev` – the site lives at `http://localhost:3000`

### Experience highlights

- **Home landing**: storytelling hero, district cards (4 districts × 8 beats), manual refresh blueprint, and an account-request form wired to the public DRF endpoint.
- **Auth**: simple credential form storing JWTs in localStorage, with `AuthContext` managing profile fetches.
- **District dashboard**:
  - Tabs for Overview, EDA (column-by-column panels), ML Lab, Upload Center, and GIS.
  - Overview tab renders KPIs, monthly trend area graph, hourly category heatmap, and Isolation Forest anomaly table using Recharts.
  - ML lab surfaces tuned/untuned model metrics plus feature importance stacks.
  - Upload center supports XLSX/CSV uploads and clipboard paste (Papaparse) with refresh job tracking.
  - GIS tab consumes backend GeoJSON caches, colors beats by incident density, and overlays district polygons on Mapbox.

## Officer workflow

1. Officers request access → admin approves → role & districts assigned.
2. Upload data via drag/drop or paste; schema preview + row counts stored on the `DataAsset`.
3. Click “Trigger refresh” – single job pulls the latest uploads sequentially, rebuilds analytics snapshots, and records status for the rest of the team.
4. Dashboards immediately reflect fresh KPIs, EDA tabs, anomaly board, tuned ML models, and GIS overlays.

## Testing

- Backend: `python manage.py test` (unit tests can be expanded), `python manage.py check` for system validation.
- Frontend: `npm run lint` (Next.js ESLint rules), `npm run dev` for smoke testing.

## Next steps

- Wire Celery/Redis if async refresh is needed.
- Add role-based UI routing + MFA (Azure AD/SAML) on the frontend.
- Extend ML lab with time-series forecasting and publishing of model artifacts via the API.
