from django.conf import settings
from django.db import ProgrammingError, OperationalError, transaction


def ensure_default_geography():
    """
    Seed district and beat rows so dashboards have reference data.
    Safe to call multiple times.
    """
    from .models import District, Beat

    config = getattr(settings, "DISTRICT_CONFIG", {})
    if not config:
        return

    try:
        with transaction.atomic():
            for district_name, payload in config.items():
                district, _ = District.objects.get_or_create(name=district_name)
                beats = payload.get("beats", [])
                for code in beats:
                    Beat.objects.get_or_create(district=district, code=code)
    except (ProgrammingError, OperationalError):
        # Database tables not ready (e.g., before migrations)
        return
