from django.conf import settings
from django.db import models


class Feedback(models.Model):
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feedback_sent",
        limit_choices_to={"role": "THERAPIST"},
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feedback_received",
        limit_choices_to={"role": "PATIENT"},
    )
    session = models.ForeignKey(
        "therapy_sessions.Session",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feedback_entries",
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback {self.id} from {self.therapist.email} to {self.patient.email}"
