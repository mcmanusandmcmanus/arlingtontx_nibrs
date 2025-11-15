from django.contrib import admin

from .models import DataAsset, RefreshJob


@admin.register(DataAsset)
class DataAssetAdmin(admin.ModelAdmin):
    list_display = ("id", "district", "status", "row_count", "created_at")
    list_filter = ("district", "status")
    search_fields = ("id", "district__name")


@admin.register(RefreshJob)
class RefreshJobAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "started_at", "finished_at")
