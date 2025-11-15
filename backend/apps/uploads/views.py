from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import District
from apps.accounts.serializers import DistrictSerializer

from .models import DataAsset, RefreshJob
from .serializers import DataAssetCreateSerializer, DataAssetSerializer, RefreshJobSerializer
from .services import get_dataframe_preview, process_refresh_job


class DataAssetViewSet(viewsets.ModelViewSet):
    queryset = DataAsset.objects.select_related("district", "uploader").all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return DataAssetCreateSerializer
        return DataAssetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.districts.exists():
            return qs.filter(district__in=profile.districts.all())
        return qs

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user, status="uploaded")

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        asset = self.get_object()
        preview = get_dataframe_preview(asset)
        return Response({"rows": preview})


class RefreshJobView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        job = RefreshJob.objects.order_by("-started_at").first()
        if not job:
            return Response({"detail": "No refresh jobs yet."})
        serializer = RefreshJobSerializer(job)
        return Response(serializer.data)

    def post(self, request):
        if RefreshJob.objects.filter(status="running").exists():
            job = RefreshJob.objects.filter(status="running").latest("started_at")
            return Response(
                {"detail": "A refresh is already running.", "job": RefreshJobSerializer(job).data},
                status=status.HTTP_409_CONFLICT,
            )
        districts = District.objects.all()
        serializer = DistrictSerializer(districts, many=True)
        job = RefreshJob.objects.create(status="running", triggered_by=request.user)
        process_refresh_job(job)
        return Response(RefreshJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)
