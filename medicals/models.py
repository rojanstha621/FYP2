from django.db import models
from django.conf import settings


class MedicalHistory(models.Model):

    patient = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medical_history",
    )

    past_injuries = models.TextField(
        blank=True, help_text="Details of any past injuries"
    )

    chronic_conditions = models.TextField(
        blank=True, help_text="Chronic conditions such as arthritis, asthma, etc."
    )

    surgeries = models.TextField(blank=True, help_text="Past surgical history")

    medications = models.TextField(blank=True, help_text="Current medications")

    allergies = models.TextField(blank=True, help_text="Known allergies")

    current_symptoms = models.TextField(
        blank=True, help_text="Current symptoms experienced by the patient"
    )

    medical_report = models.FileField(
        upload_to="medical_reports/",
        blank=True,
        null=True,
        help_text="Optional medical report (PDF)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Medical History"
        verbose_name_plural = "Medical Histories"

    def __str__(self):
        return f"Medical History - {self.patient.email}"


class TherapistPatientAssignment(models.Model):

    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_patients",
        limit_choices_to={"role": "THERAPIST"},
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_therapists",
        limit_choices_to={"role": "PATIENT"},
    )

    assigned_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(
        default=True, help_text="Indicates if the assignment is currently active"
    )

    class Meta:
        verbose_name = "Therapist-Patient Assignment"
        verbose_name_plural = "Therapist-Patient Assignments"
        unique_together = ("therapist", "patient")

    def __str__(self):
        return f"{self.therapist.email} → {self.patient.email}"
