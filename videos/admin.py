from django.contrib import admin
from .models import Video, VideoAssignment


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    Admin interface for Video model.
    """
    
    list_display = [
        "title",
        "is_active",
        "created_by",
        "created_at",
        "assignment_count",
    ]
    
    list_filter = [
        "is_active",
        "created_at",
    ]
    
    search_fields = [
        "title",
        "description",
    ]
    
    readonly_fields = [
        "youtube_embed_url",
        "thumbnail_url",
        "created_at",
        "updated_at",
    ]
    
    fieldsets = (
        ("Video Information", {
            "fields": (
                "title",
                "description",
                "youtube_url",
                "youtube_embed_url",
                "thumbnail_url",
            )
        }),
        ("Settings", {
            "fields": (
                "is_active",
                "created_by",
            )
        }),
        ("Timestamps", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )
    
    def assignment_count(self, obj):
        """Display number of active assignments"""
        return obj.assignments.filter(is_active=True).count()
    
    assignment_count.short_description = "Active Assignments"


@admin.register(VideoAssignment)
class VideoAssignmentAdmin(admin.ModelAdmin):
    """
    Admin interface for VideoAssignment model.
    """
    
    list_display = [
        "video",
        "patient",
        "therapist",
        "is_active",
        "viewed",
        "assigned_at",
    ]
    
    list_filter = [
        "is_active",
        "viewed",
        "assigned_at",
    ]
    
    search_fields = [
        "video__title",
        "patient__email",
        "patient__first_name",
        "therapist__email",
        "therapist__first_name",
    ]
    
    readonly_fields = [
        "assigned_at",
        "viewed_at",
    ]
    
    fieldsets = (
        ("Assignment Details", {
            "fields": (
                "video",
                "therapist",
                "patient",
                "notes",
            )
        }),
        ("Status", {
            "fields": (
                "is_active",
                "viewed",
                "viewed_at",
            )
        }),
        ("Timestamps", {
            "fields": (
                "assigned_at",
            )
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related("video", "therapist", "patient")

