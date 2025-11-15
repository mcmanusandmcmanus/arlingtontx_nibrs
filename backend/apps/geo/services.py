from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests
from django.conf import settings

DISTRICT_URL = "https://services.arcgis.com/jXi5GuMZwfCYtZP9/arcgis/rest/services/Arlington_Police_Districts/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
BEAT_URL = "https://gis2.arlingtontx.gov/agsext2/rest/services/OpenData/OD_PoliticalBoundary/MapServer/1/query?outFields=*&where=1%3D1&f=geojson"
CACHE_DIR = Path(settings.MEDIA_ROOT) / "geo"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _load_or_fetch(cache_name: str, url: str, hours: int = 12) -> Any:
    cache_path = CACHE_DIR / f"{cache_name}.json"
    if cache_path.exists():
        modified = datetime.fromtimestamp(cache_path.stat().st_mtime)
        if modified > datetime.now() - timedelta(hours=hours):
            return json.loads(cache_path.read_text())
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    data = response.json()
    cache_path.write_text(json.dumps(data))
    return data


def get_district_geojson():
    return _load_or_fetch("districts", DISTRICT_URL)


def get_beat_geojson():
    return _load_or_fetch("beats", BEAT_URL)
