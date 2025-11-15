from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self):
        from django.db.models.signals import post_migrate
        from . import signals  # noqa: F401
        from .bootstrap import ensure_default_geography

        def _bootstrap_geo(**kwargs):
            ensure_default_geography()

        post_migrate.connect(_bootstrap_geo, sender=self)
