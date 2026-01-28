from django.contrib import admin
from .models import Exercise, ExercisePlan, ExerciseSession


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "target_area", "difficulty", "is_active", "created_by", "created_at"]
    list_filter = ["difficulty", "is_active", "target_area"]
    search_fields = ["name", "description", "target_area"]
    ordering = ["-created_at"]


@admin.register(ExercisePlan)
class ExercisePlanAdmin(admin.ModelAdmin):
    list_display = ["exercise", "patient", "therapist", "scheduled_date", "sets", "is_active"]
    list_filter = ["is_active", "scheduled_date", "assigned_date"]
    search_fields = ["patient__email", "therapist__email", "exercise__name"]
    ordering = ["-scheduled_date", "-created_at"]
    raw_id_fields = ["patient", "therapist", "exercise"]


@admin.register(ExerciseSession)
class ExerciseSessionAdmin(admin.ModelAdmin):
    list_display = ["exercise_plan", "status", "sets_completed", "started_at", "completed_at"]
    list_filter = ["status", "completed_at", "started_at"]
    search_fields = ["exercise_plan__exercise__name", "exercise_plan__patient__email"]
    ordering = ["-created_at"]
    raw_id_fields = ["exercise_plan"]

