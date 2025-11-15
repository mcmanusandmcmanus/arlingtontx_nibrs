import uuid
from django.conf import settings
from django.db import models

from apps.accounts.models import District


class DataAsset(models.Model):
    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("queued", "Queued"),
        ("processing", "Processing"),
        ("failed", "Failed"),
        ("processed", "Processed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="data_assets"
    )
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    source_file = models.FileField(upload_to="uploads/%Y/%m/%d", blank=True, null=True)
    data_payload = models.JSONField(blank=True, null=True)
    input_format = models.CharField(
        max_length=16, choices=[("file", "File"), ("clipboard", "Clipboard")], default="file"
    )
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="uploaded")
    row_count = models.IntegerField(default=0)
    schema_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.district.name} upload {self.created_at:%Y-%m-%d}"


class RefreshJob(models.Model):
    STATUS_CHOICES = [
        ("idle", "Idle"),
        ("running", "Running"),
        ("failed", "Failed"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="idle")
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="refresh_jobs",
    )
    note = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    last_asset = models.ForeignKey(
        DataAsset, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    def __str__(self):
        return f"Refresh job {self.status}"
