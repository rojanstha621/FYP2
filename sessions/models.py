from django.db import models
from django.conf import settings


class Session(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
        limit_choices_to={"role": "PATIENT"},
    )
    exercise_plan = models.ForeignKey(
        "exercises.ExercisePlan",
        on_delete=models.CASCADE,
        related_name="therapy_sessions",
    )
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Session"
        verbose_name_plural = "Sessions"

    def __str__(self):
        return f"Session {self.id} - {self.patient.email} - {self.status}"


class SetLog(models.Model):
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="set_logs",
    )
    set_number = models.PositiveIntegerField()
    reps_completed = models.PositiveIntegerField()
    duration_seconds = models.PositiveIntegerField()
    completed = models.BooleanField(default=True)

    class Meta:
        ordering = ["session_id", "set_number"]
        verbose_name = "Set Log"
        verbose_name_plural = "Set Logs"

    def __str__(self):
        return f"Session {self.session_id} - Set {self.set_number}"
