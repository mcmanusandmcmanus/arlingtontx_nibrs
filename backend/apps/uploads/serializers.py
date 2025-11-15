from rest_framework import serializers

from apps.accounts.models import District

from .models import DataAsset, RefreshJob


class DataAssetSerializer(serializers.ModelSerializer):
    district = serializers.SlugRelatedField(slug_field="slug", queryset=District.objects.all())

    class Meta:
        model = DataAsset
        fields = [
            "id",
            "district",
            "status",
            "row_count",
            "notes",
            "input_format",
            "created_at",
            "processed_at",
            "schema_payload",
        ]


class DataAssetCreateSerializer(serializers.ModelSerializer):
    district = serializers.SlugRelatedField(slug_field="slug", queryset=District.objects.all())

    class Meta:
        model = DataAsset
        fields = [
            "id",
            "district",
            "source_file",
            "data_payload",
            "notes",
            "input_format",
        ]

    def validate(self, attrs):
        if not attrs.get("source_file") and not attrs.get("data_payload"):
            raise serializers.ValidationError(
                "Provide either a file or a clipboard payload."
            )
        return attrs


class RefreshJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefreshJob
        fields = [
            "id",
            "status",
            "started_at",
            "finished_at",
            "note",
            "last_asset",
        ]
