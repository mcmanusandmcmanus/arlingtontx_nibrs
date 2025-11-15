from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AccountRequestViewSet, BeatViewSet, DistrictViewSet, OfficerProfileView

router = DefaultRouter()
router.register("districts", DistrictViewSet, basename="district")
router.register("beats", BeatViewSet, basename="beat")
router.register("requests", AccountRequestViewSet, basename="account-request")

urlpatterns = [
    path("profile/", OfficerProfileView.as_view(), name="profile"),
    path("", include(router.urls)),
]
