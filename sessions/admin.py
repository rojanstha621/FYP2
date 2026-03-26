from django.contrib import admin

from .models import Session, SetLog


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "exercise_plan",
        "status",
        "start_time",
        "end_time",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("patient__email",)
    readonly_fields = ("start_time", "created_at")


@admin.register(SetLog)
class SetLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "set_number",
        "reps_completed",
        "duration_seconds",
        "completed",
    )
    list_filter = ("completed",)
    search_fields = ("session__patient__email",)
