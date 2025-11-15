from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AccountRequest, Beat, District, OfficerProfile

User = get_user_model()


class BeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beat
        fields = ["id", "code", "name", "description"]


class DistrictSerializer(serializers.ModelSerializer):
    beats = BeatSerializer(many=True, read_only=True)

    class Meta:
        model = District
        fields = ["id", "name", "slug", "description", "beats"]


class OfficerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class OfficerProfileSerializer(serializers.ModelSerializer):
    user = OfficerUserSerializer()
    districts = DistrictSerializer(many=True, read_only=True)
    beats = BeatSerializer(many=True, read_only=True)

    class Meta:
        model = OfficerProfile
        fields = [
            "id",
            "user",
            "role",
            "organization",
            "title",
            "districts",
            "beats",
            "receive_refresh_notifications",
        ]


class OfficerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerProfile
        fields = ["organization", "title", "role", "districts", "beats", "receive_refresh_notifications"]


class AccountRequestSerializer(serializers.ModelSerializer):
    district = serializers.SlugRelatedField(
        slug_field="slug", queryset=District.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AccountRequest
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "organization",
            "message",
            "district",
            "status",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]


class AccountRequestReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountRequest
        fields = ["status", "reviewed_at"]
