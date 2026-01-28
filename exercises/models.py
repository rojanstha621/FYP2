from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _


class Exercise(models.Model):
    """
    Exercise model for therapist-created exercise library.
    Supports both video file uploads and YouTube URLs.
    """

    class DifficultyChoices(models.TextChoices):
        EASY = "EASY", _("Easy")
        MEDIUM = "MEDIUM", _("Medium")
        HARD = "HARD", _("Hard")

    # Basic Information
    name = models.CharField(max_length=200, help_text=_("Exercise name"))
    description = models.TextField(help_text=_("Detailed description of the exercise"))
    target_area = models.CharField(
        max_length=100,
        help_text=_("Target body area (e.g., Lower Back, Knee, Shoulder)"),
    )
    difficulty = models.CharField(
        max_length=10,
        choices=DifficultyChoices.choices,
        default=DifficultyChoices.MEDIUM,
        help_text=_("Exercise difficulty level"),
    )

    # Media
    video_file = models.FileField(
        upload_to="exercises/videos/",
        blank=True,
        null=True,
        help_text=_("Upload video file (optional if YouTube URL provided)"),
    )
    youtube_url = models.URLField(
        blank=True,
        null=True,
        help_text=_("YouTube video URL (optional if video file uploaded)"),
    )
    thumbnail = models.ImageField(
        upload_to="exercises/thumbnails/",
        blank=True,
        null=True,
        help_text=_("Exercise thumbnail image"),
    )

    # Instructions & Safety
    instructions = models.TextField(
        blank=True,
        help_text=_("Step-by-step instructions for performing the exercise"),
    )
    safety_notes = models.TextField(
        blank=True,
        help_text=_("Safety precautions and contraindications"),
    )

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_exercises",
        help_text=_("Therapist who created this exercise"),
    )
    is_active = models.BooleanField(
        default=True, help_text=_("Whether the exercise is active/visible")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Exercise")
        verbose_name_plural = _("Exercises")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_area"]),
            models.Index(fields=["difficulty"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_difficulty_display()})"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Ensure at least one video source is provided
        if not self.video_file and not self.youtube_url:
            raise ValidationError(
                _("Either video file or YouTube URL must be provided.")
            )


class ExercisePlan(models.Model):
    """
    Exercise plan assigned to a patient by a therapist.
    Stores the exercise details, duration, sets, etc.
    """

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercise_plans",
        limit_choices_to={"role": "PATIENT"},
        help_text=_("Patient assigned this exercise plan"),
    )

    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_exercise_plans",
        limit_choices_to={"role": "THERAPIST"},
        help_text=_("Therapist who assigned this plan"),
    )

    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.PROTECT,
        related_name="assigned_plans",
        help_text=_("Exercise in the plan"),
    )

    # Timing and repetition
    exercise_duration = models.PositiveIntegerField(
        default=60,
        help_text=_("Duration for performing the exercise in seconds"),
    )
    rest_duration = models.PositiveIntegerField(
        default=20,
        help_text=_("Rest duration between sets in seconds"),
    )
    sets = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        help_text=_("Number of sets to perform"),
    )

    special_instructions = models.TextField(
        blank=True,
        help_text=_("Special instructions for this patient (e.g., maintain posture)"),
    )

    # Assignment dates
    assigned_date = models.DateField(
        auto_now_add=True,
        help_text=_("Date when exercise was assigned"),
    )
    
    scheduled_date = models.DateField(
        help_text=_("Date when the exercise should be performed"),
    )

    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether this plan is currently active"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Exercise Plan")
        verbose_name_plural = _("Exercise Plans")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["patient", "scheduled_date"]),
            models.Index(fields=["patient", "is_active"]),
        ]

    def __str__(self):
        return f"{self.exercise.name} → {self.patient.email} ({self.scheduled_date})"


class ExerciseSession(models.Model):
    """
    Records completion status of an exercise session.
    Tracks when a patient completes an exercise plan.
    """

    class StatusChoices(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETED = "COMPLETED", _("Completed")
        SKIPPED = "SKIPPED", _("Skipped")

    exercise_plan = models.ForeignKey(
        ExercisePlan,
        on_delete=models.CASCADE,
        related_name="sessions",
        help_text=_("Exercise plan being completed"),
    )

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
        help_text=_("Current status of the exercise session"),
    )

    sets_completed = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_("Number of sets actually completed"),
    )

    started_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_("When the patient started the exercise"),
    )

    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_("When the patient completed the exercise"),
    )

    notes = models.TextField(
        blank=True,
        help_text=_("Patient notes about the exercise (pain, difficulty, etc.)"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Exercise Session")
        verbose_name_plural = _("Exercise Sessions")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["exercise_plan", "status"]),
            models.Index(fields=["exercise_plan", "completed_at"]),
        ]

    def __str__(self):
        return f"Session: {self.exercise_plan.exercise.name} - {self.status}"

