from django.contrib import admin

from .models import AccountRequest, Beat, District, OfficerProfile


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Beat)
class BeatAdmin(admin.ModelAdmin):
    list_display = ("code", "district")
    list_filter = ("district",)


@admin.register(OfficerProfile)
class OfficerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)


@admin.register(AccountRequest)
class AccountRequestAdmin(admin.ModelAdmin):
    list_display = ("email", "district", "status", "created_at")
    list_filter = ("status", "district")
