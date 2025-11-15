from django.urls import path

from .views import BeatGeoJSONView, DistrictGeoJSONView

urlpatterns = [
    path("districts/", DistrictGeoJSONView.as_view(), name="district-geojson"),
    path("beats/", BeatGeoJSONView.as_view(), name="beat-geojson"),
]
