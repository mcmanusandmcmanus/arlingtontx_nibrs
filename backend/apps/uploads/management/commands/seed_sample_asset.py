from pathlib import Path

import pandas as pd
from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from apps.accounts.models import District
from apps.uploads.models import DataAsset
from apps.analytics.services import build_snapshot_for_asset


class Command(BaseCommand):
    help = "Load the provided XLSX file into a DataAsset and build analytics artifacts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--district",
            default="EAST",
            help="District slug to tie the dataset to.",
        )

    def handle(self, *args, **options):
        district_slug = options["district"].lower()
        try:
            district = District.objects.get(slug=district_slug)
        except District.DoesNotExist:
            raise SystemExit(f"District {district_slug} not found. Run migrations first.")

        dataset_path = Path(settings.DATASET_PATH)
        if not dataset_path.exists():
            raise SystemExit(f"Dataset path {dataset_path} missing.")

        df = pd.read_excel(dataset_path)
        asset = DataAsset.objects.create(district=district, status="uploaded")
        with dataset_path.open("rb") as fp:
            asset.source_file.save(dataset_path.name, File(fp), save=True)
        self.stdout.write(f"Created upload {asset.id}")

        build_snapshot_for_asset(asset, df)
        self.stdout.write(self.style.SUCCESS("Analytics snapshot generated."))
