from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "therapist",
        "patient",
        "is_read",
        "created_at",
    )
    list_filter = ("is_read", "created_at")
    search_fields = (
        "therapist__email",
        "patient__email",
        "message",
    )
