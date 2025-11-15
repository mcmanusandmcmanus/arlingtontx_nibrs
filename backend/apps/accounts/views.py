from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccountRequest, Beat, District, OfficerProfile
from .serializers import (
    AccountRequestReviewSerializer,
    AccountRequestSerializer,
    BeatSerializer,
    DistrictSerializer,
    OfficerProfileSerializer,
    OfficerProfileUpdateSerializer,
)


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.prefetch_related("beats").all()
    serializer_class = DistrictSerializer
    permission_classes = [permissions.AllowAny]


class BeatViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Beat.objects.select_related("district").all()
    serializer_class = BeatSerializer
    permission_classes = [permissions.IsAuthenticated]


class OfficerProfileView(APIView):
    def get(self, request):
        profile = OfficerProfile.objects.select_related("user").get(user=request.user)
        return Response(OfficerProfileSerializer(profile).data)

    def put(self, request):
        profile = OfficerProfile.objects.get(user=request.user)
        serializer = OfficerProfileUpdateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OfficerProfileSerializer(profile).data)


class AccountRequestViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
) :
    queryset = AccountRequest.objects.select_related("district").all()
    serializer_class = AccountRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return AccountRequestReviewSerializer
        return super().get_serializer_class()

    def perform_update(self, serializer):
        serializer.save(reviewed_at=timezone.now(), reviewed_by=self.request.user)
