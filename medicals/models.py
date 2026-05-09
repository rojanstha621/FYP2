from django.core.exceptions import ValidationError
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

    created_by_nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_histories_created",
        limit_choices_to={"role": "NURSE"},
        help_text="Nurse who created this medical history record",
    )

    updated_by_nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_histories_updated",
        limit_choices_to={"role": "NURSE"},
        help_text="Nurse who last updated this medical history record",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Medical History"
        verbose_name_plural = "Medical Histories"

    def __str__(self):
        return f"Medical History - {self.patient.email}"


class NursePatientAssignment(models.Model):
    nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_patients_as_nurse",
        limit_choices_to={"role": "NURSE"},
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_nurses",
        limit_choices_to={"role": "PATIENT"},
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Nurse-Patient Assignment"
        verbose_name_plural = "Nurse-Patient Assignments"
        unique_together = ("nurse", "patient")
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.nurse.email} → {self.patient.email}"


class Appointment(models.Model):
    class StatusChoices(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class TypeChoices(models.TextChoices):
        NURSE_CHECKIN = "NURSE_CHECKIN", "Nurse Check-in"
        THERAPY = "THERAPY", "Therapy"
        MEDICAL_HISTORY = "MEDICAL_HISTORY", "Medical History"
        FOLLOW_UP = "FOLLOW_UP", "Follow-up"
        OTHER = "OTHER", "Other"

    nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nurse_appointments",
        limit_choices_to={"role": "NURSE"},
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_appointments",
        limit_choices_to={"role": "PATIENT"},
    )

    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="therapist_appointments",
        null=True,
        blank=True,
        limit_choices_to={"role": "THERAPIST"},
    )

    title = models.CharField(max_length=255)
    appointment_type = models.CharField(
        max_length=30,
        choices=TypeChoices.choices,
        default=TypeChoices.NURSE_CHECKIN,
    )
    scheduled_for = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.SCHEDULED,
    )
    location = models.CharField(max_length=255, blank=True)
    is_virtual = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments_created",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
        ordering = ["-scheduled_for", "-created_at"]
        indexes = [
            models.Index(fields=["nurse", "status"]),
            models.Index(fields=["patient", "status"]),
            models.Index(fields=["therapist", "status"]),
            models.Index(fields=["scheduled_for"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.scheduled_for:%Y-%m-%d %H:%M})"

    def clean(self):
        if not self.nurse_id:
            raise ValidationError({"nurse": "Nurse is required."})

        if getattr(self.nurse, "role", None) != "NURSE":
            raise ValidationError({"nurse": "Assigned user must be a nurse."})

        if getattr(self.patient, "role", None) != "PATIENT":
            raise ValidationError({"patient": "Assigned user must be a patient."})

        nurse_assignment_exists = NursePatientAssignment.objects.filter(
            nurse=self.nurse,
            patient=self.patient,
            is_active=True,
        ).exists()
        if not nurse_assignment_exists:
            raise ValidationError({"patient": "Nurse is not assigned to this patient."})

        if self.therapist:
            if getattr(self.therapist, "role", None) != "THERAPIST":
                raise ValidationError({"therapist": "Assigned user must be a therapist."})

            therapist_assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=self.therapist,
                patient=self.patient,
                is_active=True,
            ).exists()
            if not therapist_assignment_exists:
                raise ValidationError({"therapist": "Therapist is not assigned to this patient."})

        if self.duration_minutes < 1:
            raise ValidationError({"duration_minutes": "Duration must be at least 1 minute."})


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
