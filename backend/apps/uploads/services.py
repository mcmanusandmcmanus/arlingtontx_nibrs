from typing import List

import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import DataAsset, RefreshJob


def load_dataframe_from_asset(asset: DataAsset) -> pd.DataFrame:
    if asset.source_file:
        with default_storage.open(asset.source_file.name, "rb") as fp:
            if asset.source_file.name.lower().endswith(".csv"):
                df = pd.read_csv(fp)
            else:
                df = pd.read_excel(fp)
    elif asset.data_payload:
        df = pd.DataFrame(asset.data_payload)
    else:
        df = pd.read_excel(settings.DATASET_PATH)
    return df


def infer_schema(df: pd.DataFrame) -> List[dict]:
    schema = []
    for column in df.columns:
        series = df[column]
        schema.append(
            {
                "name": column,
                "dtype": str(series.dtype),
                "unique": int(series.nunique(dropna=True)),
                "missing_pct": float(series.isna().mean()) * 100,
                "sample": series.dropna().astype(str).head(3).tolist(),
            }
        )
    return schema


def get_dataframe_preview(asset: DataAsset, limit: int = 50):
    df = load_dataframe_from_asset(asset)
    return df.head(limit).to_dict(orient="records")


def process_refresh_job(job: RefreshJob):
    from apps.analytics.services import build_snapshot_for_asset

    job.started_at = timezone.now()
    pending_assets = list(
        DataAsset.objects.filter(status__in=["uploaded", "queued"]).order_by("created_at")
    )
    if not pending_assets:
        job.status = "completed"
        job.note = "No pending assets."
        job.finished_at = timezone.now()
        job.save()
        return

    try:
        for asset in pending_assets:
            asset.status = "processing"
            asset.save(update_fields=["status"])
            df = load_dataframe_from_asset(asset)
            asset.row_count = len(df)
            asset.schema_payload = infer_schema(df)
            asset.processed_at = timezone.now()
            asset.status = "processed"
            asset.save(
                update_fields=[
                    "row_count",
                    "schema_payload",
                    "processed_at",
                    "status",
                ]
            )
            job.last_asset = asset
            build_snapshot_for_asset(asset, df)
        job.status = "completed"
    except Exception as exc:  # noqa: BLE001
        job.status = "failed"
        job.note = str(exc)
    finally:
        job.finished_at = timezone.now()
        job.save()
