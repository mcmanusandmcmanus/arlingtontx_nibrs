from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DataAssetViewSet, RefreshJobView

router = DefaultRouter()
router.register("", DataAssetViewSet, basename="data-asset")

urlpatterns = [
    path("refresh/", RefreshJobView.as_view(), name="refresh-job"),
    path("", include(router.urls)),
]
