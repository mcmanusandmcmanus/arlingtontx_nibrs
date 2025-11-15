from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AnalyticsSnapshotSerializer
from .services import latest_snapshot_for_district


class DistrictSnapshotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, district_slug: str):
        snapshot = latest_snapshot_for_district(district_slug)
        if not snapshot:
            return Response({"detail": "No analytics available yet."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AnalyticsSnapshotSerializer(snapshot)
        return Response(serializer.data)


class ColumnAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, district_slug: str, column_name: str):
        snapshot = latest_snapshot_for_district(district_slug)
        if not snapshot:
            return Response({"detail": "No analytics available."}, status=status.HTTP_404_NOT_FOUND)
        column_key = column_name.replace("-", " ")
        column_payload = snapshot.eda_payload.get(column_key) or snapshot.eda_payload.get(column_name)
        if not column_payload:
            return Response({"detail": "Column not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"column": column_key, "metrics": column_payload})


class ModelAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, district_slug: str):
        snapshot = latest_snapshot_for_district(district_slug)
        if not snapshot:
            return Response({"detail": "No analytics available."}, status=status.HTTP_404_NOT_FOUND)
        return Response(snapshot.ml_payload)
