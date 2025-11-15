from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.text import slugify

User = get_user_model()


class District(models.Model):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Beat(models.Model):
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="beats"
    )
    code = models.CharField(max_length=8)
    name = models.CharField(max_length=128, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("district", "code")

    def __str__(self) -> str:
        return f"{self.district.slug}-{self.code}"


class OfficerProfile(models.Model):
    ROLE_CHOICES = [
        ("officer", "Officer"),
        ("analyst", "Analyst"),
        ("command", "Command Staff"),
        ("observer", "Observer"),
        ("admin", "Administrator"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="observer")
    organization = models.CharField(max_length=128, blank=True)
    title = models.CharField(max_length=128, blank=True)
    districts = models.ManyToManyField(District, blank=True)
    beats = models.ManyToManyField(Beat, blank=True)
    receive_refresh_notifications = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} ({self.role})"


class AccountRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    email = models.EmailField()
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    organization = models.CharField(max_length=128, blank=True)
    message = models.TextField(blank=True)
    district = models.ForeignKey(
        District, on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_requests",
    )

    def __str__(self) -> str:
        return f"{self.email} ({self.status})"
