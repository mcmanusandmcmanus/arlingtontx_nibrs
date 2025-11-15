from django.urls import path

from .views import ColumnAnalyticsView, DistrictSnapshotView, ModelAnalyticsView

urlpatterns = [
    path("districts/<slug:district_slug>/snapshot/", DistrictSnapshotView.as_view(), name="district-snapshot"),
    path("districts/<slug:district_slug>/columns/<str:column_name>/", ColumnAnalyticsView.as_view(), name="column-analytics"),
    path("districts/<slug:district_slug>/models/", ModelAnalyticsView.as_view(), name="model-analytics"),
]
