from rest_framework import serializers

from .models import AnalyticsSnapshot


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            "id",
            "district",
            "beat",
            "eda_payload",
            "multivariate_payload",
            "ml_payload",
            "anomalies_payload",
            "generated_at",
        ]
        depth = 1
