from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import get_beat_geojson, get_district_geojson


class DistrictGeoJSONView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(get_district_geojson())


class BeatGeoJSONView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(get_beat_geojson())
