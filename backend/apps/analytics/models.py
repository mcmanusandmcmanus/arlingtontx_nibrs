import uuid
from django.db import models

from apps.accounts.models import Beat, District
from apps.uploads.models import DataAsset


class AnalyticsSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_asset = models.ForeignKey(
        DataAsset, on_delete=models.CASCADE, related_name="snapshots"
    )
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="snapshots"
    )
    beat = models.ForeignKey(
        Beat, on_delete=models.SET_NULL, null=True, blank=True, related_name="snapshots"
    )
    eda_payload = models.JSONField(default=dict)
    multivariate_payload = models.JSONField(default=dict)
    ml_payload = models.JSONField(default=dict)
    anomalies_payload = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.district.name} snapshot {self.generated_at:%Y-%m-%d}"
