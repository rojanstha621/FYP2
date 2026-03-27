from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
import re


def extract_youtube_video_id(url):
    """
    Extract YouTube video ID from various YouTube URL formats.
    Returns the video ID or None if not found.
    """
    if not url:
        return None
    
    # Patterns for different YouTube URL formats
    patterns = [
        # Standard watch URLs, including extra query params before/after v.
        r'(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:[&#?].*)?$',
        # Short links (youtu.be).
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?#].*)?$',
        # Embed URLs.
        r'(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[?#].*)?$',
        # Shorts URLs.
        r'(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[?#].*)?$',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


class Video(models.Model):
    """
    Video model for admin-managed educational videos.
    Stores YouTube videos with auto-generated embed URLs.
    """
    
    title = models.CharField(
        max_length=255, 
        help_text=_("Video title")
    )
    
    description = models.TextField(
        blank=True,
        help_text=_("Video description and learning objectives")
    )
    
    youtube_url = models.URLField(
        help_text=_("YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)")
    )
    
    youtube_embed_url = models.URLField(
        blank=True,
        help_text=_("Auto-generated YouTube embed URL")
    )
    
    thumbnail_url = models.URLField(
        blank=True,
        help_text=_("YouTube thumbnail URL (auto-generated)")
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether the video is active and can be assigned")
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_videos",
        limit_choices_to={"role": "ADMIN"},
        help_text=_("Admin who added this video")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Video")
        verbose_name_plural = _("Videos")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["-created_at"]),
        ]
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Validate YouTube URL"""
        if self.youtube_url:
            video_id = extract_youtube_video_id(self.youtube_url)
            if not video_id:
                raise ValidationError(
                    {"youtube_url": _("Invalid YouTube URL. Please provide a valid YouTube video URL.")}
                )
    
    def save(self, *args, **kwargs):
        """Auto-generate embed URL and thumbnail from YouTube URL"""
        if self.youtube_url:
            video_id = extract_youtube_video_id(self.youtube_url)
            if video_id:
                self.youtube_embed_url = f"https://www.youtube.com/embed/{video_id}"
                self.thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        
        super().save(*args, **kwargs)


class VideoAssignment(models.Model):
    """
    Therapist-to-Patient video assignment model.
    Tracks which videos are assigned to which patients.
    """
    
    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="assignments",
        help_text=_("Assigned video")
    )
    
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_assignments_made",
        limit_choices_to={"role": "THERAPIST"},
        help_text=_("Therapist who assigned the video")
    )
    
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_assignments_received",
        limit_choices_to={"role": "PATIENT"},
        help_text=_("Patient receiving the video assignment")
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_("Therapist's notes for this assignment")
    )

    segment_start_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text=_("Optional segment start time in seconds")
    )

    segment_end_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text=_("Optional segment end time in seconds")
    )

    repeat_count = models.PositiveSmallIntegerField(
        default=1,
        help_text=_("How many times the selected segment should repeat")
    )

    pause_between_repeats_seconds = models.PositiveSmallIntegerField(
        default=0,
        help_text=_("Pause duration in seconds between segment repeats")
    )
    
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_("When the video was assigned")
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether this assignment is currently active")
    )
    
    # Tracking fields
    viewed = models.BooleanField(
        default=False,
        help_text=_("Whether the patient has viewed the video")
    )
    
    viewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("When the patient first viewed the video")
    )
    
    class Meta:
        verbose_name = _("Video Assignment")
        verbose_name_plural = _("Video Assignments")
        ordering = ["-assigned_at"]
        unique_together = [("video", "patient", "therapist")]
        indexes = [
            models.Index(fields=["therapist", "is_active"]),
            models.Index(fields=["patient", "is_active"]),
            models.Index(fields=["-assigned_at"]),
        ]
    
    def __str__(self):
        return f"{self.video.title} → {self.patient.email} (by {self.therapist.email})"
    
    def clean(self):
        """Validate assignment constraints"""
        from medicals.models import TherapistPatientAssignment

        if (self.segment_start_seconds is None) != (self.segment_end_seconds is None):
            raise ValidationError(
                _("Provide both segment start and end times, or leave both empty.")
            )

        if (
            self.segment_start_seconds is not None
            and self.segment_end_seconds is not None
            and self.segment_end_seconds <= self.segment_start_seconds
        ):
            raise ValidationError(
                {"segment_end_seconds": _("Segment end time must be greater than start time.")}
            )

        if self.repeat_count < 1:
            raise ValidationError(
                {"repeat_count": _("Repeat count must be at least 1.")}
            )

        if self.repeat_count > 1 and self.segment_start_seconds is None:
            raise ValidationError(
                {"repeat_count": _("Repeat count greater than 1 requires a segment start and end.")}
            )

        if self.pause_between_repeats_seconds < 0:
            raise ValidationError(
                {"pause_between_repeats_seconds": _("Pause between repeats cannot be negative.")}
            )

        if self.pause_between_repeats_seconds > 0 and self.repeat_count == 1:
            raise ValidationError(
                {
                    "pause_between_repeats_seconds": _(
                        "Pause between repeats is only used when repeat count is greater than 1."
                    )
                }
            )
        
        # Check if video is active
        if self.video and not self.video.is_active:
            raise ValidationError(
                {"video": _("Cannot assign an inactive video.")}
            )
        
        # Check if therapist is assigned to patient
        if self.therapist and self.patient:
            assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=self.therapist,
                patient=self.patient,
                is_active=True
            ).exists()
            
            if not assignment_exists:
                raise ValidationError(
                    _("Therapist is not assigned to this patient.")
                )
